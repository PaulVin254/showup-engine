import { SequenceStage, ShowUpTemplate } from "./types";

export interface DefaultTemplateBlueprint {
  name: string;
  stage: SequenceStage;
  stageLabel: string;
  timingLabel: string;
  category: "UTILITY" | "MARKETING";
  language: string;
  body_text: string;
  button_type: "NONE" | "URL" | "QUICK_REPLY";
  button_text?: string;
  button_url_pattern?: string;
  variables_schema: string[];
  example_values: string[];
}

export const DEFAULT_WEBINAR_TEMPLATES: DefaultTemplateBlueprint[] = [
  {
    name: "event_registration_confirmed",
    stage: "instant_welcome",
    stageLabel: "Stage 1: Instant Registration Confirmation",
    timingLabel: "Instant (T+0s)",
    category: "UTILITY",
    language: "en",
    body_text:
      "Hi {{1}}, you're registered ✅\n\nEvent: {{2}}\nDate: {{3}}\nTime: {{4}} (EAT)\n\nYour link to join will be sent right here on WhatsApp before we start. Reply STOP to opt out of reminders.",
    button_type: "NONE",
    variables_schema: ["Registrant First Name", "Event Title", "Event Date (EAT)", "Event Time (EAT)"],
    example_values: ["Wanjiku", "Nairobi Real Estate & Wealth Masterclass", "Saturday, 14 Nov", "7:00 PM"],
  },
  {
    name: "event_calendar_link",
    stage: "calendar_link",
    stageLabel: "Stage 2: 1-Click Calendar Lock-In",
    timingLabel: "+2 Minutes After Registration",
    category: "UTILITY",
    language: "en",
    body_text:
      "Hi {{1}}, lock {{2}} into your phone calendar now so nothing gets in the way:\n\n📅 {{3}}\n\nWe go live on {{4}} at {{5}} (EAT). See you inside!",
    button_type: "NONE",
    variables_schema: [
      "Registrant First Name",
      "Event Title",
      "Google Calendar Link",
      "Event Date (EAT)",
      "Event Time (EAT)",
    ],
    example_values: [
      "Wanjiku",
      "Nairobi Real Estate & Wealth Masterclass",
      "https://calendar.google.com/calendar",
      "Saturday, 14 Nov",
      "7:00 PM",
    ],
  },
  {
    name: "event_teaser_24h",
    stage: "t_24h",
    stageLabel: "Stage 3: 24-Hour Value Teaser & Micro-Commitment",
    timingLabel: "24 Hours Before Start (T-24h)",
    category: "MARKETING",
    language: "en",
    body_text:
      "Hi {{1}}, {{2}} is happening tomorrow at {{3}} (EAT) 🎯\n\nIn this live session, {{4}} will walk you through {{5}}.\n\nReply YES to confirm your seat—your private join link arrives tomorrow.",
    button_type: "QUICK_REPLY",
    button_text: "YES, I'll be there",
    variables_schema: [
      "Registrant First Name",
      "Event Title",
      "Event Time (EAT)",
      "Host Name",
      "Teaser Hook",
    ],
    example_values: [
      "Wanjiku",
      "Nairobi Real Estate & Wealth Masterclass",
      "7:00 PM",
      "Brian",
      "how to evaluate high-yield plots in Kiambu & Machakos without getting burned",
    ],
  },
  {
    name: "event_starting_1h",
    stage: "t_1h",
    stageLabel: "Stage 4: 60-Minute Preparation Alert",
    timingLabel: "1 Hour Before Start (T-1h)",
    category: "UTILITY",
    language: "en",
    body_text:
      "Hi {{1}}, {{2}} starts in exactly 1 hour at {{3}} (EAT) ⏰\n\nGrab a notebook, charge your phone or laptop, and get on stable Wi-Fi or bundles. Your direct join link comes 5 minutes before we begin.",
    button_type: "NONE",
    variables_schema: ["Registrant First Name", "Event Title", "Event Time (EAT)"],
    example_values: ["Wanjiku", "Nairobi Real Estate & Wealth Masterclass", "7:00 PM"],
  },
  {
    name: "event_live_now",
    stage: "live_now",
    stageLabel: "Stage 5: 'We Are Live Now' Tracked Room Link",
    timingLabel: "5 Minutes Before Start (T-5m)",
    category: "UTILITY",
    language: "en",
    body_text:
      "Hi {{1}}, WE ARE LIVE NOW 🔴\n\n{{2}} has just opened the room.\n\nTap your personal access link below to join immediately:\n👉 {{3}}\n\nSee you inside the room!",
    button_type: "NONE",
    variables_schema: ["Registrant First Name", "Event Title", "Tracked Join Link (/j/token)"],
    example_values: [
      "Wanjiku",
      "Nairobi Real Estate & Wealth Masterclass",
      "https://showup.eris.co.ke/j/wk92x8a",
    ],
  },
];

export function renderTemplatePreview(bodyText: string, values: string[]): string {
  let rendered = bodyText;
  values.forEach((val, idx) => {
    const placeholder = new RegExp(`\\{\\{${idx + 1}\\}\\}`, "g");
    rendered = rendered.replace(placeholder, val || `{{${idx + 1}}}`);
  });
  return rendered;
}

export function buildGoogleCalendarUrl(params: {
  title: string;
  startsAtIso: string;
  durationMinutes?: number;
  description?: string;
}): string {
  const start = new Date(params.startsAtIso);
  const end = new Date(start.getTime() + (params.durationMinutes || 90) * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details:
      params.description ||
      "Your live join link will be sent to your WhatsApp 5 minutes before we start.",
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function formatEatDate(isoUtc: string): { dateStr: string; timeStr: string; fullStr: string } {
  const date = new Date(isoUtc);
  const dateStr = new Intl.DateTimeFormat("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Africa/Nairobi",
  }).format(date);

  const timeStr = new Intl.DateTimeFormat("en-KE", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Nairobi",
  }).format(date);

  return {
    dateStr,
    timeStr,
    fullStr: `${dateStr} at ${timeStr} EAT`,
  };
}

export function seedSystemTemplatesForTenant(tenantId: string): ShowUpTemplate[] {
  return DEFAULT_WEBINAR_TEMPLATES.map((tpl, idx) => ({
    id: `tpl-default-${idx + 1}`,
    tenant_id: tenantId,
    meta_template_id: `meta_std_${tpl.name}`,
    name: tpl.name,
    category: tpl.category,
    language: tpl.language,
    status: "APPROVED",
    stage_default: tpl.stage,
    body_text: tpl.body_text,
    button_type: tpl.button_type,
    button_text: tpl.button_text || null,
    button_url_pattern: tpl.button_url_pattern || null,
    variables_schema: tpl.variables_schema,
    is_system_default: true,
    created_at: new Date().toISOString(),
  }));
}

