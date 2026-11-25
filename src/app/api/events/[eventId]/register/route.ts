export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { checkRegisterIpRateLimit } from "@/lib/rate-limiter";
import { scheduleAndFireSequenceForRegistrant } from "@/lib/scheduler";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { ShowUpEvent, ShowUpRegistrant } from "@/lib/types";

export async function POST(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await context.params;
    const body = await req.json();
    const {
      fullName,
      phone,
      email = "",
      source = "hosted_page",
      consentGiven,
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full name and WhatsApp phone number are required." },
        { status: 400 }
      );
    }

    if (consentGiven !== true) {
      return NextResponse.json(
        { error: "WhatsApp reminder consent is required to register." },
        { status: 400 }
      );
    }

    const clientIp =
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      "127.0.0.1";

    const ipCheck = await checkRegisterIpRateLimit(clientIp);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts from your network. Please try again later." },
        { status: 429 }
      );
    }

    const phoneE164 = normalizeKenyanPhone(String(phone));
    if (!phoneE164) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number. Please enter a valid Kenyan WhatsApp number (e.g. 0712 345 678).",
        },
        { status: 400 }
      );
    }

    const supabaseReady = await checkSupabaseMigrationStatus();

    let event: ShowUpEvent | undefined;
    if (supabaseReady && supabase) {
      const { data } = await supabase
        .from("showup_events")
        .select("*")
        .or(`id.eq.${eventId},slug.eq.${eventId}`)
        .maybeSingle();
      if (data) event = data as ShowUpEvent;
    } else {
      const db = readLocalDb();
      event = db.events.find((e) => e.id === eventId || e.slug === eventId);
    }

    if (!event) {
      return NextResponse.json({ error: "Webinar event not found." }, { status: 404 });
    }

    // Per-event phone deduplication BEFORE quota check, DB write, and WhatsApp send
    if (supabaseReady && supabase) {
      const { data: existingReg } = await supabase
        .from("showup_registrants")
        .select("*")
        .eq("event_id", event.id)
        .eq("phone_e164", phoneE164)
        .maybeSingle();

      if (existingReg) {
        return NextResponse.json({
          success: true,
          alreadyRegistered: true,
          registrant: existingReg,
          scheduledMessages: [],
        });
      }
    } else {
      const db = readLocalDb();
      const existingReg = db.registrants.find(
        (r) => r.event_id === event!.id && r.phone_e164 === phoneE164
      );
      if (existingReg) {
        return NextResponse.json({
          success: true,
          alreadyRegistered: true,
          registrant: existingReg,
          scheduledMessages: [],
        });
      }
    }

    const { tenant } = await getActiveTenant(event.tenant_id);

    // Check registrant limit on current plan
    if (tenant.registrants_used_this_month >= tenant.registrant_limit) {
      return NextResponse.json(
        {
          error: `Monthly registrant cap (${tenant.registrant_limit}) reached on the ${tenant.plan_tier.toUpperCase()} tier. Upgrade via M-Pesa to unlock more registrants.`,
        },
        { status: 402 }
      );
    }

    const trackingToken = `${Math.random().toString(36).slice(2, 8)}${Date.now()
      .toString(36)
      .slice(-3)}`;

    const registrant: ShowUpRegistrant = {
      id: crypto.randomUUID(),
      event_id: event.id,
      tenant_id: tenant.id,
      full_name: String(fullName).trim(),
      phone_e164: phoneE164,
      email: email ? String(email).trim() : null,
      source: source as ShowUpRegistrant["source"],
      meta_lead_id: null,
      tracking_token: trackingToken,
      consent_given: true,
      opted_out: false,
      clicked_join_link: false,
      joined_at: null,
      zoom_verified: false,
      zoom_duration_minutes: 0,
      created_at: new Date().toISOString(),
    };

    if (supabaseReady && supabase) {
      const { data: savedReg, error: regErr } = await supabase
        .from("showup_registrants")
        .insert(registrant)
        .select("*")
        .single();

      if (regErr) {
        // Race-condition safety: if unique constraint fired concurrently, return existing cleanly
        if (regErr.code === "23505") {
          const { data: raceExisting } = await supabase
            .from("showup_registrants")
            .select("*")
            .eq("event_id", event.id)
            .eq("phone_e164", phoneE164)
            .maybeSingle();
          if (raceExisting) {
            return NextResponse.json({
              success: true,
              alreadyRegistered: true,
              registrant: raceExisting,
              scheduledMessages: [],
            });
          }
        }
        throw new Error(regErr.message);
      }

      await supabase
        .from("showup_tenants")
        .update({
          registrants_used_this_month: tenant.registrants_used_this_month + 1,
        })
        .eq("id", tenant.id);

      const scheduled = await scheduleAndFireSequenceForRegistrant({
        tenant,
        event,
        registrant: savedReg as ShowUpRegistrant,
      });

      return NextResponse.json({
        success: true,
        alreadyRegistered: false,
        registrant: savedReg,
        scheduledMessages: scheduled,
      });
    }

    // Local DB fallback
    const db = readLocalDb();
    db.registrants.unshift(registrant);
    const tTarget = db.tenants.find((t) => t.id === tenant.id);
    if (tTarget) {
      tTarget.registrants_used_this_month += 1;
    }
    writeLocalDb(db);

    const scheduled = await scheduleAndFireSequenceForRegistrant({
      tenant,
      event,
      registrant,
    });

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      registrant,
      scheduledMessages: scheduled,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed registering lead" },
      { status: 500 }
    );
  }
}

