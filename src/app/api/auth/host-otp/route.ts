export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  DEFAULT_TENANT_ID,
  findOrCreateTenantByPhone,
  readLocalDb,
  supabase,
  TENANT_COOKIE_NAME,
} from "@/lib/store";
import { dispatchSmartWhatsAppMessage } from "@/lib/whatsapp-api";

// In-memory fallback for OTP storage if showup_rate_limits table is not yet migrated
const memoryOtpStore = new Map<string, { code: number; expiresAt: number }>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = "send_otp", phone, code } = body;

    // Action 1: Logout / Clear Host Session
    if (action === "logout") {
      const res = NextResponse.json({
        success: true,
        message: "Signed out of host workspace.",
      });
      res.cookies.delete(TENANT_COOKIE_NAME);
      return res;
    }

    // Action 2: Load Sample Demo Room (for testing / previewing)
    if (action === "load_demo") {
      const db = readLocalDb();
      const firstTenant = db.tenants[0];
      if (supabase) {
        const { data: existing } = await supabase
          .from("showup_tenants")
          .select("id")
          .eq("id", DEFAULT_TENANT_ID)
          .maybeSingle();
        if (!existing && firstTenant) {
          await supabase.from("showup_tenants").insert(firstTenant);
        }
      }
      const res = NextResponse.json({
        success: true,
        tenantId: DEFAULT_TENANT_ID,
        message: "Loaded sample demo workspace.",
      });
      res.cookies.set(TENANT_COOKIE_NAME, DEFAULT_TENANT_ID, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      });
      return res;
    }

    const phoneE164 = normalizeKenyanPhone(String(phone || ""));
    if (!phoneE164) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid Kenyan WhatsApp number (e.g. 0712 345 678).",
        },
        { status: 400 }
      );
    }

    const otpKey = `otp:${phoneE164}`;

    // Action 3: Send 6-Digit WhatsApp OTP
    if (action === "send_otp") {
      const otpCode = Math.floor(100000 + Math.random() * 900000);
      const now = Date.now();
      const expiresAtMs = now + 10 * 60 * 1000; // 10 minutes
      const expiresAtIso = new Date(expiresAtMs).toISOString();

      memoryOtpStore.set(otpKey, { code: otpCode, expiresAt: expiresAtMs });

      if (supabase) {
        try {
          await supabase.from("showup_rate_limits").upsert({
            key: otpKey,
            count: otpCode,
            window_start: new Date(now).toISOString(),
            expires_at: expiresAtIso,
          });
        } catch {
          // Fallback to memoryOtpStore if table not yet migrated
        }
      }

      const tenant = await findOrCreateTenantByPhone({ phoneE164 });

      // Send 6-digit code via Verified Shared ShowUp WhatsApp Number
      const sendRes = await dispatchSmartWhatsAppMessage({
        tenant,
        senderMode: "shared_showup",
        toPhoneE164: phoneE164,
        templateName: "event_registration_confirmed",
        bodyVariables: [
          `Host (Code: ${otpCode})`,
          `ShowUp Engine Login Code: ${otpCode}`,
          "Valid for 10 mins",
          "EAT",
        ],
        recipientFirstName: `Host (Code: ${otpCode})`,
      });

      return NextResponse.json({
        success: true,
        phoneE164,
        simulated: sendRes.simulated,
        // Provide fallback preview if running in simulated/offline mode
        devHint: sendRes.simulated ? String(otpCode) : undefined,
        message: `We sent a 6-digit login code to your WhatsApp (+${phoneE164}).`,
      });
    }

    // Action 4: Verify 6-Digit WhatsApp OTP
    if (action === "verify_otp") {
      const numericCode = Number(String(code || "").trim());
      if (!numericCode || String(code || "").trim().length !== 6) {
        return NextResponse.json(
          { error: "Please enter the 6-digit code sent to your WhatsApp." },
          { status: 400 }
        );
      }

      let valid = false;
      const now = Date.now();

      // Check Supabase first
      if (supabase) {
        try {
          const { data } = await supabase
            .from("showup_rate_limits")
            .select("*")
            .eq("key", otpKey)
            .maybeSingle();

          if (data) {
            const exp = new Date(data.expires_at).getTime();
            if (exp > now && Number(data.count) === numericCode) {
              valid = true;
              await supabase.from("showup_rate_limits").delete().eq("key", otpKey);
            }
          }
        } catch {
          // Ignore and check memory fallback
        }
      }

      // Check memory store fallback
      const mem = memoryOtpStore.get(otpKey);
      if (!valid && mem && mem.expiresAt > now && mem.code === numericCode) {
        valid = true;
        memoryOtpStore.delete(otpKey);
      }

      if (!valid) {
        return NextResponse.json(
          {
            error:
              "Invalid or expired 6-digit code. Please request a fresh code.",
          },
          { status: 401 }
        );
      }

      const tenant = await findOrCreateTenantByPhone({ phoneE164 });
      const res = NextResponse.json({
        success: true,
        tenant,
        message: `Welcome back! Loaded workspace for +${phoneE164}.`,
      });

      res.cookies.set(TENANT_COOKIE_NAME, tenant.id, {
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
        sameSite: "lax",
      });

      return res;
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed processing host auth",
      },
      { status: 500 }
    );
  }
}

