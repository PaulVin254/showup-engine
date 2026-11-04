export type SequenceStage =
  | "instant_welcome"
  | "calendar_link"
  | "t_24h"
  | "t_1h"
  | "live_now";

export type PlanTier = "pilot" | "event_pass" | "event_scale" | "starter" | "pro";

export type SenderMode = "shared_showup" | "own_waba";

export interface ShowUpTenant {
  id: string;
  owner_user_id?: string | null;
  business_name: string;
  email?: string | null;
  phone_e164?: string | null;
  waba_id?: string | null;
  phone_number_id?: string | null;
  display_phone_number?: string | null;
  access_token?: string | null;
  waba_status: "disconnected" | "connected" | "restricted";
  connected_at?: string | null;
  plan_tier: PlanTier;
  registrant_limit: number;
  registrants_used_this_month: number;
  billing_cycle_end?: string | null;
  created_at: string;
}

export interface ShowUpTemplate {
  id: string;
  tenant_id: string;
  meta_template_id?: string | null;
  name: string;
  category: "UTILITY" | "MARKETING";
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  stage_default: SequenceStage | "custom";
  body_text: string;
  button_type: "NONE" | "URL" | "QUICK_REPLY";
  button_text?: string | null;
  button_url_pattern?: string | null;
  variables_schema: string[];
  is_system_default: boolean;
  created_at: string;
}

export interface StageTemplateMap {
  instant_welcome: string;
  calendar_link: string;
  t_24h: string;
  t_1h: string;
  live_now: string;
}

export interface ShowUpEvent {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  host_name: string;
  teaser_hook: string;
  starts_at: string; // ISO UTC
  timezone: string;
  join_url: string;
  meta_form_id?: string | null;
  webhook_secret: string;
  stage_templates: StageTemplateMap;
  ad_spend_kes: number;
  baseline_showup_rate: number;
  offer_price_kes: number;
  expected_close_rate: number;
  status: "upcoming" | "live" | "completed" | "cancelled";
  is_paid?: boolean;
  sender_mode?: SenderMode;
  paid_pass_tier?: "event_pass" | "event_scale" | "starter" | "pro";
  mpesa_receipt?: string | null;
  created_at: string;
}

export interface ShowUpRegistrant {
  id: string;
  event_id: string;
  tenant_id: string;
  full_name: string;
  phone_e164: string;
  email?: string | null;
  source: "hosted_page" | "meta_lead_ad" | "csv_import" | "webhook" | "manual_test";
  meta_lead_id?: string | null;
  tracking_token: string;
  consent_given: boolean;
  opted_out: boolean;
  clicked_join_link: boolean;
  joined_at?: string | null;
  zoom_verified: boolean;
  zoom_duration_minutes?: number;
  created_at: string;
}

export interface ShowUpScheduledMessage {
  id: string;
  registrant_id: string;
  event_id: string;
  tenant_id: string;
  stage: SequenceStage;
  template_name: string;
  scheduled_for: string;
  qstash_message_id?: string | null;
  status: "scheduled" | "sending" | "sent" | "delivered" | "read" | "failed" | "skipped";
  wamid?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  created_at: string;
}

export interface ShowUpPayment {
  id: string;
  tenant_id: string;
  event_id?: string | null;
  plan_tier: "event_pass" | "event_scale" | "starter" | "pro";
  amount_kes: number;
  phone_e164: string;
  checkout_request_id?: string | null;
  mpesa_receipt?: string | null;
  status: "pending" | "completed" | "failed";
  created_at: string;
}

