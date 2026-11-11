import { ShowUpEvent } from "./types";

export type Lifecycle = "zero" | "scheduled" | "live" | "finished";

/** Live room window: opens 15 min before start, closes 90 min after. */
export const LIVE_LEAD_MS = 15 * 60 * 1000;
export const LIVE_TAIL_MS = 90 * 60 * 1000;

export function deriveLifecycle(
  event: ShowUpEvent | null | undefined,
  now: number
): Lifecycle {
  if (!event) return "zero";
  if (event.status === "completed" || event.status === "cancelled") {
    return "finished";
  }
  const start = new Date(event.starts_at).getTime();
  if (now > start + LIVE_TAIL_MS) return "finished";
  if (now >= start - LIVE_LEAD_MS) return "live";
  return "scheduled";
}

export function splitDuration(ms: number) {
  const abs = Math.max(0, Math.floor(ms / 1000));
  return {
    d: Math.floor(abs / 86400),
    h: Math.floor((abs % 86400) / 3600),
    m: Math.floor((abs % 3600) / 60),
    s: abs % 60,
  };
}

export const pad2 = (n: number) => String(n).padStart(2, "0");

/** 24h East Africa Time formatter. */
export function fmtEat(
  input: string | number | Date,
  opts: { date?: boolean; seconds?: boolean } = {}
): string {
  const d = new Date(input);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: opts.seconds ? "2-digit" : undefined,
    hour12: false,
    timeZone: "Africa/Nairobi",
  }).format(d);
  if (!opts.date) return time;
  const date = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Nairobi",
  }).format(d);
  return `${date}, ${time}`;
}

export function relativeAgo(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

