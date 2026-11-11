import {
  SequenceStage,
  ShowUpEvent,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
} from "./types";
import {
  DEFAULT_WEBINAR_TEMPLATES,
  DefaultTemplateBlueprint,
  buildGoogleCalendarUrl,
  formatEatDate,
} from "./default-templates";
import { fmtEat } from "./lifecycle";

export interface PipelineStageMeta {
  key: SequenceStage;
  step: number;
  label: string;
  /** Rule shown when no absolute time applies. */
  rule: string;
  /** ms before start; null for signup-relative stages. */
  offsetBeforeMs: number | null;
}

export const PIPELINE_STAGES: PipelineStageMeta[] = [
  { key: "instant_welcome", step: 1, label: "Welcome", rule: "On signup", offsetBeforeMs: null },
  { key: "calendar_link", step: 2, label: "Calendar", rule: "Signup + 2 min", offsetBeforeMs: null },
  { key: "t_24h", step: 3, label: "24h reminder", rule: "T−24h", offsetBeforeMs: 24 * 3600e3 },
  { key: "t_1h", step: 4, label: "1h reminder", rule: "T−1h", offsetBeforeMs: 3600e3 },
  { key: "live_now", step: 5, label: "Live link", rule: "T−5m", offsetBeforeMs: 5 * 60e3 },
];

export function stageTemplate(stage: SequenceStage): DefaultTemplateBlueprint {
  return (
    DEFAULT_WEBINAR_TEMPLATES.find((t) => t.stage === stage) ||
    DEFAULT_WEBINAR_TEMPLATES[0]
  );
}

/** Absolute send time (ms) for time-anchored stages, else null. */
export function stageSendAt(meta: PipelineStageMeta, event: ShowUpEvent): number | null {
  if (meta.offsetBeforeMs === null) return null;
  return new Date(event.starts_at).getTime() - meta.offsetBeforeMs;
}

export function stageTimingLabel(meta: PipelineStageMeta, event: ShowUpEvent): string {
  const at = stageSendAt(meta, event);
  return at === null ? meta.rule : `${meta.rule} · ${fmtEat(at, { date: true })} EAT`;
}

/** Variable values matching each real template's {{n}} schema. */
export function stagePreviewValues(
  stage: SequenceStage,
  event: ShowUpEvent,
  origin: string,
  firstName = "Wanjiku"
): string[] {
  const { dateStr, timeStr } = formatEatDate(event.starts_at);
  const host = event.host_name || "Host";
  const hook = event.teaser_hook || "the full playbook";
  switch (stage) {
    case "instant_welcome":
      return [firstName, event.title, dateStr, timeStr];
    case "calendar_link":
      return [
        firstName,
        event.title,
        buildGoogleCalendarUrl({ title: event.title, startsAtIso: event.starts_at }).slice(0, 48) + "…",
        dateStr,
        timeStr,
      ];
    case "t_24h":
      return [firstName, event.title, timeStr, host, hook];
    case "t_1h":
      return [firstName, event.title, timeStr];
    case "live_now":
      return [firstName, event.title, `${origin.replace(/^https?:\/\//, "")}/j/wk92x8a`];
  }
}

export interface StageSummary {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  queued: number;
  state: "done" | "partial" | "failed" | "queued";
}

export function summarizeStage(
  messages: ShowUpScheduledMessage[],
  stage: SequenceStage
): StageSummary {
  const m = messages.filter((x) => x.stage === stage);
  const read = m.filter((x) => x.status === "read").length;
  const delivered = m.filter((x) => x.status === "delivered").length + read;
  const sent = m.filter((x) => x.status === "sent").length + delivered;
  const failed = m.filter((x) => x.status === "failed").length;
  const queued = m.filter((x) => ["scheduled", "sending"].includes(x.status)).length;
  let state: StageSummary["state"] = "queued";
  if (failed > 0) state = "failed";
  else if (sent > 0 && queued === 0) state = "done";
  else if (sent > 0) state = "partial";
  return { total: m.length, sent, delivered, read, failed, queued, state };
}

export interface EventMetrics {
  total: number;
  optedOut: number;
  attended: number;
  showupPct: number;
  messagesSent: number;
  deliveryPct: number | null;
  readPct: number | null;
  failed: number;
  notJoined: number;
}

export function computeMetrics(
  registrants: ShowUpRegistrant[],
  messages: ShowUpScheduledMessage[]
): EventMetrics {
  const total = registrants.length;
  const attended = registrants.filter((r) => r.clicked_join_link || r.zoom_verified).length;
  const read = messages.filter((m) => m.status === "read").length;
  const delivered = messages.filter((m) => m.status === "delivered").length + read;
  const sent = messages.filter((m) => m.status === "sent").length + delivered;
  const failed = messages.filter((m) => m.status === "failed").length;
  const attempted = sent + failed;
  return {
    total,
    optedOut: registrants.filter((r) => r.opted_out).length,
    attended,
    showupPct: total > 0 ? Math.round((attended / total) * 100) : 0,
    messagesSent: sent,
    deliveryPct: attempted > 0 ? Math.round((delivered / attempted) * 100) : null,
    readPct: delivered > 0 ? Math.round((read / delivered) * 100) : null,
    failed,
    notJoined: Math.max(0, total - attended),
  };
}

/**
 * Normalizes user-entered meeting links:
 * - Bare domain (e.g. meet.google.com/xyz or zoom.us/j/123) -> https://...
 * - Trims whitespace
 */
export function normalizeJoinUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export interface MeetingPlatformInfo {
  name: string;
  badgeColor: string;
}

export function detectMeetingPlatform(url: string): MeetingPlatformInfo | null {
  const lower = url.toLowerCase().trim();
  if (!lower) return null;
  if (lower.includes("meet.google.com")) {
    return { name: "Google Meet", badgeColor: "text-emerald-400" };
  }
  if (lower.includes("zoom.us")) {
    return { name: "Zoom", badgeColor: "text-blue-400" };
  }
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
    return { name: "YouTube Live", badgeColor: "text-red-400" };
  }
  if (lower.includes("teams.microsoft.com") || lower.includes("teams.live.com")) {
    return { name: "Microsoft Teams", badgeColor: "text-indigo-400" };
  }
  if (lower.includes("webex.com")) {
    return { name: "Webex", badgeColor: "text-cyan-400" };
  }
  return null;
}


