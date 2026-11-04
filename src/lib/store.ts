import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  ShowUpEvent,
  ShowUpPayment,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
  ShowUpTemplate,
  ShowUpTenant,
} from "./types";
import { seedSystemTemplatesForTenant } from "./default-templates";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export interface LocalDbSchema {
  tenants: ShowUpTenant[];
  templates: ShowUpTemplate[];
  events: ShowUpEvent[];
  registrants: ShowUpRegistrant[];
  scheduled_messages: ShowUpScheduledMessage[];
  payments: ShowUpPayment[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "showup-db.json");

export const DEFAULT_TENANT_ID = "11111111-1111-1111-1111-111111111111";
export const DEMO_EVENT_ID = "22222222-2222-2222-2222-222222222222";

function createInitialSeed(): LocalDbSchema {
  const now = new Date();
  // Set demo webinar 2 days from now at 7:00 PM EAT (16:00 UTC)
  const startsAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(16, 0, 0, 0);

  const tenant: ShowUpTenant = {
    id: DEFAULT_TENANT_ID,
    business_name: "Nairobi Wealth & Academy Ltd",
    email: "founder@showup.co.ke",
    phone_e164: "254727838624",
    waba_id: "1317581530311429",
    phone_number_id: "1017704028092663",
    display_phone_number: "+254 727 838624",
    access_token:
      "EAANdEphmfOABS9h93GUiCBhIXLZBCpssom5Oq5ggqucOVLhOo7IRWNQfeVi0tUDcxkZCMgyveiNMNQMwzKD3OXfaZCHHPW44TqhkucbSxmDkzPk9fsxyTOcG55mtZBinrZBNUXsGTSWaZASejYvSTE2ZB3Qthzu6RjjHmRP2tx0ZCfsZCKZCuuhxlClYDM2C0uBeQrS23aksZCypGkx9p7aocDS44BDDgNOwfXyjO3fwbZAiDFmpj7lFSq7itsCc0ZBAagHR9YhuecHS9TI3q2fTIZCzZC5P7AiEwZDZD",
    waba_status: "connected",
    connected_at: now.toISOString(),
    plan_tier: "pilot",
    registrant_limit: 100,
    registrants_used_this_month: 6,
    billing_cycle_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now.toISOString(),
  };

  const templates = seedSystemTemplatesForTenant(DEFAULT_TENANT_ID);

  const demoEvent: ShowUpEvent = {
    id: DEMO_EVENT_ID,
    tenant_id: DEFAULT_TENANT_ID,
    title: "Nairobi Real Estate & Passive Income Masterclass",
    slug: "nairobi-real-estate-masterclass",
    host_name: "Brian (Founder)",
    teaser_hook:
      "how to spot high-yield plots & REITs in Kenya without losing capital to fake titles",
    starts_at: startsAt.toISOString(),
    timezone: "Africa/Nairobi",
    join_url: "https://meet.google.com/landing",
    meta_form_id: "meta_form_88291044",
    webhook_secret: "whsec_kenya_showup_2026",
    stage_templates: {
      instant_welcome: "event_registration_confirmed",
      calendar_link: "event_calendar_link",
      t_24h: "event_teaser_24h",
      t_1h: "event_starting_1h",
      live_now: "event_live_now",
    },
    ad_spend_kes: 50000,
    baseline_showup_rate: 20,
    offer_price_kes: 25000,
    expected_close_rate: 6,
    status: "upcoming",
    is_paid: true,
    sender_mode: "shared_showup",
    paid_pass_tier: "event_pass",
    mpesa_receipt: "SJK9402KLA",
    created_at: now.toISOString(),
  };

  const sampleNames = [
    { name: "Wanjiku Kamau", phone: "254712340101", email: "wanjiku@gmail.com", clicked: true, source: "meta_lead_ad" as const },
    { name: "Kevin Omondi", phone: "254722890202", email: "kevin.o@yahoo.com", clicked: true, source: "hosted_page" as const },
    { name: "Faith Mutua", phone: "254733450303", email: "faith.mutua@gmail.com", clicked: true, source: "meta_lead_ad" as const },
    { name: "Dennis Kiprop", phone: "254711900404", email: "kiprop.d@outlook.com", clicked: true, source: "hosted_page" as const },
    { name: "Mercy Njeri", phone: "254799110505", email: "mercy.njeri@gmail.com", clicked: false, source: "csv_import" as const },
    { name: "Brian Otieno", phone: "254701220606", email: "botieno@gmail.com", clicked: false, source: "meta_lead_ad" as const },
  ];

  const registrants: ShowUpRegistrant[] = sampleNames.map((item, idx) => ({
    id: `reg-seed-${idx + 1}`,
    event_id: DEMO_EVENT_ID,
    tenant_id: DEFAULT_TENANT_ID,
    full_name: item.name,
    phone_e164: item.phone,
    email: item.email,
    source: item.source,
    meta_lead_id: item.source === "meta_lead_ad" ? `leadgen_${1000 + idx}` : null,
    tracking_token: `ke${idx + 1}x90${idx}`,
    consent_given: true,
    opted_out: false,
    clicked_join_link: item.clicked,
    joined_at: item.clicked ? new Date(now.getTime() - idx * 120000).toISOString() : null,
    zoom_verified: item.clicked,
    zoom_duration_minutes: item.clicked ? 54 : 0,
    created_at: new Date(now.getTime() - (idx + 1) * 3600 * 1000).toISOString(),
  }));

  const scheduled_messages: ShowUpScheduledMessage[] = [];
  for (const reg of registrants) {
    scheduled_messages.push(
      {
        id: `msg-${reg.id}-1`,
        registrant_id: reg.id,
        event_id: DEMO_EVENT_ID,
        tenant_id: DEFAULT_TENANT_ID,
        stage: "instant_welcome",
        template_name: "event_registration_confirmed",
        scheduled_for: reg.created_at,
        status: "read",
        wamid: `wamid.seed_${reg.id}_1`,
        sent_at: reg.created_at,
        delivered_at: reg.created_at,
        read_at: reg.created_at,
        created_at: reg.created_at,
      },
      {
        id: `msg-${reg.id}-2`,
        registrant_id: reg.id,
        event_id: DEMO_EVENT_ID,
        tenant_id: DEFAULT_TENANT_ID,
        stage: "calendar_link",
        template_name: "event_calendar_link",
        scheduled_for: reg.created_at,
        status: "delivered",
        wamid: `wamid.seed_${reg.id}_2`,
        sent_at: reg.created_at,
        delivered_at: reg.created_at,
        created_at: reg.created_at,
      },
      {
        id: `msg-${reg.id}-3`,
        registrant_id: reg.id,
        event_id: DEMO_EVENT_ID,
        tenant_id: DEFAULT_TENANT_ID,
        stage: "t_24h",
        template_name: "event_teaser_24h",
        scheduled_for: new Date(startsAt.getTime() - 24 * 3600 * 1000).toISOString(),
        status: "scheduled",
        created_at: reg.created_at,
      },
      {
        id: `msg-${reg.id}-4`,
        registrant_id: reg.id,
        event_id: DEMO_EVENT_ID,
        tenant_id: DEFAULT_TENANT_ID,
        stage: "t_1h",
        template_name: "event_starting_1h",
        scheduled_for: new Date(startsAt.getTime() - 3600 * 1000).toISOString(),
        status: "scheduled",
        created_at: reg.created_at,
      },
      {
        id: `msg-${reg.id}-5`,
        registrant_id: reg.id,
        event_id: DEMO_EVENT_ID,
        tenant_id: DEFAULT_TENANT_ID,
        stage: "live_now",
        template_name: "event_live_now",
        scheduled_for: new Date(startsAt.getTime() - 5 * 60 * 1000).toISOString(),
        status: "scheduled",
        created_at: reg.created_at,
      }
    );
  }

  return {
    tenants: [tenant],
    templates,
    events: [demoEvent],
    registrants,
    scheduled_messages,
    payments: [],
  };
}

export function readLocalDb(): LocalDbSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const seed = createInitialSeed();
      fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), "utf-8");
      return seed;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as LocalDbSchema;
  } catch {
    return createInitialSeed();
  }
}

export function writeLocalDb(db: LocalDbSchema): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed writing local DB fallback:", err);
  }
}

/**
 * Checks whether the `showup_tenants` table has been created in the user's Supabase database yet.
 */
export async function checkSupabaseMigrationStatus(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("showup_tenants").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function getActiveTenant(): Promise<{
  tenant: ShowUpTenant;
  supabaseReady: boolean;
}> {
  const supabaseReady = await checkSupabaseMigrationStatus();
  if (supabaseReady && supabase) {
    const { data } = await supabase
      .from("showup_tenants")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data) {
      return { tenant: data as ShowUpTenant, supabaseReady: true };
    }

    // Seed initial tenant in Supabase if table is empty
    const seed = readLocalDb();
    const firstTenant = seed.tenants[0];
    const { data: inserted } = await supabase
      .from("showup_tenants")
      .insert(firstTenant)
      .select("*")
      .single();

    if (inserted) {
      // Also seed system templates
      await supabase.from("showup_templates").upsert(
        seed.templates.map(({ id: _unused, ...rest }) => rest),
        { onConflict: "tenant_id,name,language" }
      );
      return { tenant: inserted as ShowUpTenant, supabaseReady: true };
    }
  }

  const db = readLocalDb();
  return { tenant: db.tenants[0], supabaseReady };
}

export async function updateTenantWabaConnection(params: {
  tenantId: string;
  wabaId: string;
  phoneNumberId: string;
  displayPhoneNumber?: string | null;
  accessToken: string;
}): Promise<ShowUpTenant> {
  const supabaseReady = await checkSupabaseMigrationStatus();
  const now = new Date().toISOString();

  if (supabaseReady && supabase) {
    const { data, error } = await supabase
      .from("showup_tenants")
      .update({
        waba_id: params.wabaId,
        phone_number_id: params.phoneNumberId,
        display_phone_number: params.displayPhoneNumber || null,
        access_token: params.accessToken,
        waba_status: "connected",
        connected_at: now,
        updated_at: now,
      })
      .eq("id", params.tenantId)
      .select("*")
      .single();

    if (!error && data) {
      return data as ShowUpTenant;
    }
  }

  const db = readLocalDb();
  const idx = db.tenants.findIndex((t) => t.id === params.tenantId);
  const target = idx >= 0 ? db.tenants[idx] : db.tenants[0];
  target.waba_id = params.wabaId;
  target.phone_number_id = params.phoneNumberId;
  target.display_phone_number = params.displayPhoneNumber || target.display_phone_number || "+254 712 345 678";
  target.access_token = params.accessToken;
  target.waba_status = "connected";
  target.connected_at = now;
  writeLocalDb(db);
  return target;
}

