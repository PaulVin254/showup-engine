import {
  SequenceStage,
  ShowUpEvent,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
  ShowUpTenant,
} from "./types";
import { buildGoogleCalendarUrl, formatEatDate } from "./default-templates";
import { dispatchSmartWhatsAppMessage } from "./whatsapp-api";
import { checkSupabaseMigrationStatus, readLocalDb, supabase, writeLocalDb } from "./store";

const QSTASH_URL = process.env.QSTASH_URL || "https://qstash.upstash.io";
const QSTASH_TOKEN = process.env.QSTASH_TOKEN || "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

export interface ComputedStageSchedule {
  stage: SequenceStage;
  templateName: string;
  scheduledFor: Date;
  skipReason?: string;
}

/**
 * Calculates the 5-stage sequence schedule in UTC for a registrant joining an event.
 * Implements Smart Stage Collapse:
 * - If registering < 24h before event start, skips `t_24h`
 * - If registering < 1h before event start, skips `t_1h`
 */
export function computeFiveStageSchedule(
  event: ShowUpEvent,
  registeredAt = new Date()
): ComputedStageSchedule[] {
  const startsAt = new Date(event.starts_at);
  const msUntilStart = startsAt.getTime() - registeredAt.getTime();

  const t24hDate = new Date(startsAt.getTime() - 24 * 60 * 60 * 1000);
  const t1hDate = new Date(startsAt.getTime() - 60 * 60 * 1000);
  const liveNowDate = new Date(startsAt.getTime() - 5 * 60 * 1000);

  return [
    {
      stage: "instant_welcome",
      templateName: event.stage_templates?.instant_welcome || "event_registration_confirmed",
      scheduledFor: registeredAt,
    },
    {
      stage: "calendar_link",
      templateName: event.stage_templates?.calendar_link || "event_calendar_link",
      scheduledFor: new Date(registeredAt.getTime() + 2 * 60 * 1000),
    },
    {
      stage: "t_24h",
      templateName: event.stage_templates?.t_24h || "event_teaser_24h",
      scheduledFor: t24hDate,
      skipReason:
        msUntilStart < 24 * 60 * 60 * 1000
          ? "Registered less than 24h before webinar start (smart collapse)"
          : undefined,
    },
    {
      stage: "t_1h",
      templateName: event.stage_templates?.t_1h || "event_starting_1h",
      scheduledFor: t1hDate,
      skipReason:
        msUntilStart < 60 * 60 * 1000
          ? "Registered less than 1h before webinar start (smart collapse)"
          : undefined,
    },
    {
      stage: "live_now",
      templateName: event.stage_templates?.live_now || "event_live_now",
      scheduledFor: liveNowDate.getTime() > registeredAt.getTime() ? liveNowDate : registeredAt,
    },
  ];
}

/**
 * Builds the exact template body variables for each of the 5 stages
 */
export function buildStageVariables(params: {
  stage: SequenceStage;
  event: ShowUpEvent;
  registrant: ShowUpRegistrant;
}): { bodyVariables: string[]; buttonUrlSuffix?: string } {
  const { stage, event, registrant } = params;
  const firstName = registrant.full_name.trim().split(/\s+/)[0] || "Friend";
  const { dateStr, timeStr } = formatEatDate(event.starts_at);
  const calendarUrl = buildGoogleCalendarUrl({
    title: event.title,
    startsAtIso: event.starts_at,
  });
  const trackedJoinUrl = `${APP_URL}/j/${registrant.tracking_token}`;

  switch (stage) {
    case "instant_welcome":
      return {
        bodyVariables: [firstName, event.title, dateStr, timeStr],
      };
    case "calendar_link":
      return {
        bodyVariables: [firstName, event.title, calendarUrl, dateStr, timeStr],
      };
    case "t_24h":
      return {
        bodyVariables: [firstName, event.title, timeStr, event.host_name, event.teaser_hook],
      };
    case "t_1h":
      return {
        bodyVariables: [firstName, event.title, timeStr],
      };
    case "live_now":
      return {
        bodyVariables: [firstName, event.title, trackedJoinUrl],
        buttonUrlSuffix: registrant.tracking_token,
      };
  }
}

/**
 * Schedules a delayed HTTP callback via Upstash QStash if QSTASH_TOKEN is configured
 */
async function scheduleWithQStash(params: {
  scheduledMessageId: string;
  notBeforeDate: Date;
}): Promise<string | null> {
  if (!QSTASH_TOKEN) return null;
  // QStash cannot publish to localhost; skip QStash call if APP_URL is localhost
  if (APP_URL.includes("localhost") || APP_URL.includes("127.0.0.1")) {
    return `qstash_local_dev_${params.scheduledMessageId}`;
  }

  try {
    const destination = `${APP_URL}/api/jobs/dispatch-message`;
    const notBeforeSeconds = Math.floor(params.notBeforeDate.getTime() / 1000);

    const res = await fetch(`${QSTASH_URL}/v2/publish/${destination}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${QSTASH_TOKEN}`,
        "Content-Type": "application/json",
        "Upstash-Not-Before": String(notBeforeSeconds),
        "Upstash-Retries": "3",
      },
      body: JSON.stringify({
        scheduledMessageId: params.scheduledMessageId,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data.messageId as string) || null;
  } catch {
    return null;
  }
}

/**
 * Enqueues the 5-stage WhatsApp sequence for a new registrant and immediately fires Stage 1
 */
export async function scheduleAndFireSequenceForRegistrant(params: {
  tenant: ShowUpTenant;
  event: ShowUpEvent;
  registrant: ShowUpRegistrant;
}): Promise<ShowUpScheduledMessage[]> {
  const { tenant, event, registrant } = params;
  const stages = computeFiveStageSchedule(event, new Date());
  const supabaseReady = await checkSupabaseMigrationStatus();
  const createdMessages: ShowUpScheduledMessage[] = [];

  for (const item of stages) {
    const msgId = crypto.randomUUID();
    const isSkipped = Boolean(item.skipReason);

    const record: ShowUpScheduledMessage = {
      id: msgId,
      registrant_id: registrant.id,
      event_id: event.id,
      tenant_id: tenant.id,
      stage: item.stage,
      template_name: item.templateName,
      scheduled_for: item.scheduledFor.toISOString(),
      qstash_message_id: null,
      status: isSkipped ? "skipped" : "scheduled",
      wamid: null,
      error_message: item.skipReason || null,
      sent_at: null,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    if (item.stage === "instant_welcome" && !isSkipped) {
      // Fire Stage 1 immediately
      const vars = buildStageVariables({
        stage: "instant_welcome",
        event,
        registrant,
      });

      const sendResult = await dispatchSmartWhatsAppMessage({
        tenant,
        senderMode: event.sender_mode || "shared_showup",
        toPhoneE164: registrant.phone_e164,
        templateName: item.templateName,
        bodyVariables: vars.bodyVariables,
        recipientFirstName: registrant.full_name.trim().split(/\s+/)[0] || "Friend",
      });

      if (sendResult.success) {
        record.status = "sent";
        record.wamid = sendResult.wamid || null;
        record.sent_at = new Date().toISOString();
      } else {
        record.status = "failed";
        record.error_message = sendResult.error || "Failed sending instant welcome";
      }
    } else if (!isSkipped) {
      // Schedule via Upstash QStash
      const qstashId = await scheduleWithQStash({
        scheduledMessageId: msgId,
        notBeforeDate: item.scheduledFor,
      });
      record.qstash_message_id = qstashId;
    }

    createdMessages.push(record);
  }

  if (supabaseReady && supabase) {
    await supabase.from("showup_scheduled_messages").upsert(createdMessages, {
      onConflict: "registrant_id,stage",
    });
  } else {
    const db = readLocalDb();
    db.scheduled_messages.push(...createdMessages);
    writeLocalDb(db);
  }

  return createdMessages;
}

