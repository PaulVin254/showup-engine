import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
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
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await req.json();
    const {
      fullName,
      phone,
      email = "",
      source = "hosted_page",
      consentGiven = true,
    } = body;

    if (!fullName || !phone) {
      return NextResponse.json(
        { error: "Full name and WhatsApp phone number are required." },
        { status: 400 }
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

    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    // Check registrant limit on current plan
    if (tenant.registrants_used_this_month >= tenant.registrant_limit) {
      return NextResponse.json(
        {
          error: `Monthly registrant cap (${tenant.registrant_limit}) reached on the ${tenant.plan_tier.toUpperCase()} tier. Upgrade via M-Pesa to unlock more registrants.`,
        },
        { status: 402 }
      );
    }

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
      consent_given: Boolean(consentGiven),
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
        .upsert(registrant, { onConflict: "event_id,phone_e164" })
        .select("*")
        .single();

      if (regErr) throw new Error(regErr.message);

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
        registrant: savedReg,
        scheduledMessages: scheduled,
      });
    }

    // Local DB fallback
    const db = readLocalDb();
    const existingIdx = db.registrants.findIndex(
      (r) => r.event_id === event!.id && r.phone_e164 === phoneE164
    );

    if (existingIdx >= 0) {
      db.registrants[existingIdx].full_name = registrant.full_name;
      registrant.id = db.registrants[existingIdx].id;
      registrant.tracking_token = db.registrants[existingIdx].tracking_token;
    } else {
      db.registrants.unshift(registrant);
      db.tenants[0].registrants_used_this_month += 1;
    }
    writeLocalDb(db);

    const scheduled = await scheduleAndFireSequenceForRegistrant({
      tenant,
      event,
      registrant,
    });

    return NextResponse.json({
      success: true,
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

