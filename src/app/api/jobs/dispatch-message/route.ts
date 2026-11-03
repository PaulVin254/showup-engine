import { NextResponse } from "next/server";
import { buildStageVariables } from "@/lib/scheduler";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import {
  SequenceStage,
  ShowUpEvent,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
} from "@/lib/types";
import { sendWhatsAppTemplateMessage } from "@/lib/whatsapp-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scheduledMessageId, eventId, stage } = body;

    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();
    const db = readLocalDb();

    // Case 1: Bulk trigger a specific stage (e.g. 't_24h', 't_1h', or 'live_now') for an entire Event
    if (eventId && stage) {
      let event: ShowUpEvent | undefined = db.events.find((e) => e.id === eventId);
      let registrants: ShowUpRegistrant[] = db.registrants.filter(
        (r) => r.event_id === eventId && !r.opted_out
      );

      if (supabaseReady && supabase) {
        const [evRes, regRes] = await Promise.all([
          supabase.from("showup_events").select("*").eq("id", eventId).maybeSingle(),
          supabase
            .from("showup_registrants")
            .select("*")
            .eq("event_id", eventId)
            .eq("opted_out", false),
        ]);
        if (evRes.data) event = evRes.data as ShowUpEvent;
        if (regRes.data) registrants = regRes.data as ShowUpRegistrant[];
      }

      if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }

      const stageKey = stage as SequenceStage;
      const templateName =
        event.stage_templates?.[stageKey] || "event_registration_confirmed";

      let sentCount = 0;
      for (const reg of registrants) {
        const vars = buildStageVariables({
          stage: stageKey,
          event,
          registrant: reg,
        });

        const res = await sendWhatsAppTemplateMessage({
          phoneNumberId: tenant.phone_number_id || "demo_phone_id",
          accessToken: tenant.access_token || "demo_access_token",
          toPhoneE164: reg.phone_e164,
          templateName,
          bodyVariables: vars.bodyVariables,
          buttonUrlSuffix: vars.buttonUrlSuffix,
        });

        if (res.success) {
          sentCount += 1;
          const nowIso = new Date().toISOString();

          if (supabaseReady && supabase) {
            await supabase
              .from("showup_scheduled_messages")
              .update({
                status: "sent",
                wamid: res.wamid || null,
                sent_at: nowIso,
              })
              .eq("registrant_id", reg.id)
              .eq("stage", stageKey);
          } else {
            const msg = db.scheduled_messages.find(
              (m) => m.registrant_id === reg.id && m.stage === stageKey
            );
            if (msg) {
              msg.status = "sent";
              msg.wamid = res.wamid || null;
              msg.sent_at = nowIso;
            }
          }
        }
      }

      if (!supabaseReady) writeLocalDb(db);

      return NextResponse.json({
        success: true,
        sentCount,
        totalRegistrants: registrants.length,
        message: `Dispatched '${stageKey}' (${templateName}) to ${sentCount} registrants!`,
      });
    }

    // Case 2: Single scheduled message callback (invoked by Upstash QStash at exact send_at timestamp)
    if (!scheduledMessageId) {
      return NextResponse.json(
        { error: "Provide scheduledMessageId or (eventId + stage)" },
        { status: 400 }
      );
    }

    let msg: ShowUpScheduledMessage | undefined = db.scheduled_messages.find(
      (m) => m.id === scheduledMessageId
    );

    if (supabaseReady && supabase) {
      const { data } = await supabase
        .from("showup_scheduled_messages")
        .select("*")
        .eq("id", scheduledMessageId)
        .maybeSingle();
      if (data) msg = data as ShowUpScheduledMessage;
    }

    if (!msg) {
      return NextResponse.json({ error: "Scheduled message not found" }, { status: 404 });
    }

    // Idempotency guard
    if (msg.status === "sent" || msg.status === "delivered" || msg.status === "read") {
      return NextResponse.json({
        success: true,
        alreadySent: true,
        wamid: msg.wamid,
      });
    }

    const event = db.events.find((e) => e.id === msg!.event_id);
    const registrant = db.registrants.find((r) => r.id === msg!.registrant_id);

    if (!event || !registrant || registrant.opted_out) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: "Event missing or registrant opted out",
      });
    }

    const vars = buildStageVariables({
      stage: msg.stage,
      event,
      registrant,
    });

    const sendRes = await sendWhatsAppTemplateMessage({
      phoneNumberId: tenant.phone_number_id || "demo_phone_id",
      accessToken: tenant.access_token || "demo_access_token",
      toPhoneE164: registrant.phone_e164,
      templateName: msg.template_name,
      bodyVariables: vars.bodyVariables,
      buttonUrlSuffix: vars.buttonUrlSuffix,
    });

    const nowIso = new Date().toISOString();
    msg.status = sendRes.success ? "sent" : "failed";
    msg.wamid = sendRes.wamid || null;
    msg.sent_at = sendRes.success ? nowIso : null;
    msg.error_message = sendRes.error || null;

    if (supabaseReady && supabase) {
      await supabase
        .from("showup_scheduled_messages")
        .update({
          status: msg.status,
          wamid: msg.wamid,
          sent_at: msg.sent_at,
          error_message: msg.error_message,
        })
        .eq("id", msg.id);
    } else {
      writeLocalDb(db);
    }

    return NextResponse.json({
      success: sendRes.success,
      wamid: sendRes.wamid,
      stage: msg.stage,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Dispatch worker error" },
      { status: 500 }
    );
  }
}

