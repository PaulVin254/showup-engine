export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  checkOtpIpRateLimit,
  checkOtpPhoneCooldown,
  checkOtpPhoneDailyLimit,
  clearOtpVerifyAttempts,
  recordOtpVerifyAttempt,
} from "@/lib/rate-limiter";
import {
  clearTenantSessionCookie,
  DEFAULT_TENANT_ID,
  findOrCreateTenantByPhone,
  readLocalDb,
  setTenantSessionCookie,
  supabase,
} from "@/lib/store";
import { sendWhatsAppOtpMessage } from "@/lib/whatsapp-api";

// In-memory fallback for OTP storage if showup_rate_limits table is not yet migrated
const memoryOtpStore = new Map<string, { code: number; expiresAt: number }>();

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "127.0.0.1"
  );
}

async function deleteStoredOtp(otpKey: string): Promise<void> {
  memoryOtpStore.delete(otpKey);
  if (supabase) {
    try {
      await supabase.from("showup_rate_limits").delete().eq("key", otpKey);
    } catch {
      // Ignore if table not yet migrated
    }
  }
}

function formatMetaOtpError(metaCode?: number, rawError?: string): string {
  if (metaCode === 190) {
    return "WhatsApp login is temporarily unavailable (Meta access token expired). Please contact support.";
  }
  if (metaCode === 132001 || metaCode === 131058 || rawError?.includes("does not exist")) {
    return "The WhatsApp login template is awaiting Meta approval on our Eris Engineering account. Please try again shortly.";
  }
  if (metaCode === 131026 || metaCode === 131030) {
    return "This number could not receive a WhatsApp message. Check that it is registered on WhatsApp and try again.";
  }
  return "Could not send your WhatsApp login code right now. Please try again in a moment.";
}

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
      return clearTenantSessionCookie(res);
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
      return setTenantSessionCookie(res, DEFAULT_TENANT_ID);
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
      const clientIp = getClientIp(req);

      const ipCheck = await checkOtpIpRateLimit(clientIp);
      if (!ipCheck.allowed) {
        return NextResponse.json(
          {
            error:
              "Too many login code requests from your network. Please try again in an hour.",
          },
          { status: 429 }
        );
      }

      const cooldownCheck = await checkOtpPhoneCooldown(phoneE164);
      if (!cooldownCheck.allowed) {
        return NextResponse.json(
          {
            error: "Please wait 60 seconds before requesting another login code.",
            retryAfterSeconds: 60,
          },
          { status: 429 }
        );
      }

      const dailyCheck = await checkOtpPhoneDailyLimit(phoneE164);
      if (!dailyCheck.allowed) {
        return NextResponse.json(
          {
            error:
              "You have reached today's login code limit for this number. Please try again tomorrow.",
          },
          { status: 429 }
        );
      }

      const otpCode = crypto.randomInt(100000, 1000000);
      const now = Date.now();
      const expiresAtMs = now + 10 * 60 * 1000; // 10 minutes
      const expiresAtIso = new Date(expiresAtMs).toISOString();

      memoryOtpStore.set(otpKey, { code: otpCode, expiresAt: expiresAtMs });
      await clearOtpVerifyAttempts(phoneE164);

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

      // Send 6-digit OTP via Official Meta AUTHENTICATION template on Eris Engineering WABA
      const sendRes = await sendWhatsAppOtpMessage({
        toPhoneE164: phoneE164,
        otpCode: String(otpCode),
      });

      if (!sendRes.success) {
        await deleteStoredOtp(otpKey);
        console.error("[host-otp] Meta WhatsApp OTP dispatch failed:", {
          phoneE164,
          metaErrorCode: sendRes.metaErrorCode,
          metaErrorSubcode: sendRes.metaErrorSubcode,
          error: sendRes.error,
        });

        return NextResponse.json(
          {
            error: formatMetaOtpError(sendRes.metaErrorCode, sendRes.error),
          },
          { status: 502 }
        );
      }

      const allowDevHint =
        Boolean(sendRes.simulated) && process.env.NODE_ENV !== "production";

      return NextResponse.json({
        success: true,
        phoneE164,
        simulated: Boolean(sendRes.simulated),
        resendCooldownSeconds: 60,
        devHint: allowDevHint ? String(otpCode) : undefined,
        message: `We sent a 6-digit login code to your WhatsApp (+${phoneE164}).`,
      });
    }

    // Action 4: Verify 6-Digit WhatsApp OTP
    if (action === "verify_otp") {
      const trimmedCode = String(code || "").trim();
      if (!/^\d{6}$/.test(trimmedCode)) {
        return NextResponse.json(
          { error: "Please enter the 6-digit code sent to your WhatsApp." },
          { status: 400 }
        );
      }

      const attemptCheck = await recordOtpVerifyAttempt(phoneE164);
      if (!attemptCheck.allowed) {
        await deleteStoredOtp(otpKey);
        return NextResponse.json(
          {
            error:
              "Too many incorrect attempts. Your code has been invalidated — please request a new one.",
          },
          { status: 429 }
        );
      }

      const numericCode = Number(trimmedCode);
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
      }

      if (!valid) {
        const remaining = Math.max(0, 5 - attemptCheck.count);
        if (remaining === 0) {
          await deleteStoredOtp(otpKey);
        }
        return NextResponse.json(
          {
            error:
              remaining > 0
                ? `Invalid or expired 6-digit code (${remaining} ${remaining === 1 ? "try" : "tries"} left).`
                : "Too many incorrect attempts. Please request a fresh code.",
          },
          { status: 401 }
        );
      }

      await deleteStoredOtp(otpKey);
      await clearOtpVerifyAttempts(phoneE164);

      const tenant = await findOrCreateTenantByPhone({ phoneE164 });
      const res = NextResponse.json({
        success: true,
        tenant,
        message: `Welcome back! Loaded workspace for +${phoneE164}.`,
      });

      return setTenantSessionCookie(res, tenant.id);
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
