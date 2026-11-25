import fs from "fs";
import path from "path";
import { auth, currentUser } from "@clerk/nextjs/server";
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
import { normalizeKenyanPhone } from "./phone";

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
const FOUNDER_AIRTEL_TENANT_ID = "ec604aa0-52dc-4aec-b5ca-aa6cf7393857";
const FOUNDER_EMAILS = new Set(["vinwakolipaul@gmail.com", "paul@eris.co.ke"]);

export function sanitizeTenantForClient(tenant: ShowUpTenant): ShowUpTenant {
  return {
    ...tenant,
    access_token: null,
  };
}

function createInitialSeed(): LocalDbSchema {
  const now = new Date();
  // Set demo webinar 2 days from now at 7:00 PM EAT (16:00 UTC)
  const startsAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  startsAt.setUTCHours(16, 0, 0, 0);

  const tenant: ShowUpTenant = {
    id: DEFAULT_TENANT_ID,
    business_name: "Nairobi Wealth & Academy Ltd",
    email: "paul@eris.co.ke",
    phone_e164: "254727838624",
    waba_id: process.env.SHOWUP_SHARED_WABA_ID || "1238919841044022",
    phone_number_id: process.env.SHOWUP_SHARED_PHONE_NUMBER_ID || "1017704028092663",
    display_phone_number: "+254 727 838624",
    access_token: "demo_access_token",
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

export async function getTenantById(tenantId: string): Promise<ShowUpTenant | null> {
  if (!tenantId || tenantId === "guest") return null;
  const supabaseReady = await checkSupabaseMigrationStatus();

  if (supabaseReady && supabase) {
    const { data } = await supabase
      .from("showup_tenants")
      .select("*")
      .eq("id", tenantId)
      .maybeSingle();
    if (data) return data as ShowUpTenant;
  }

  const db = readLocalDb();
  return db.tenants.find((t) => t.id === tenantId) || null;
}

export async function findOrCreateTenantByClerkUser(params: {
  clerkUserId: string;
  email?: string | null;
  fullName?: string | null;
  phoneE164?: string | null;
}): Promise<ShowUpTenant> {
  const { clerkUserId, email, fullName, phoneE164 } = params;
  const supabaseReady = await checkSupabaseMigrationStatus();
  const now = new Date().toISOString();
  const cleanEmail = email?.trim().toLowerCase() || "";
  const cleanName = fullName?.trim() || "";

  if (supabaseReady && supabase) {
    // 1. Direct lookup by clerk_user_id
    const { data: existing, error: lookupErr } = await supabase
      .from("showup_tenants")
      .select("*")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();

    if (lookupErr && lookupErr.message?.includes("clerk_user_id")) {
      console.error(
        "[store] Missing clerk_user_id column on showup_tenants. Run: ALTER TABLE showup_tenants ADD COLUMN IF NOT EXISTS clerk_user_id TEXT UNIQUE;"
      );
    }

    if (existing) {
      return existing as ShowUpTenant;
    }

    // 2. One-time migration: claim an existing unclaimed tenant matching founder or verified email/phone
    if (!lookupErr) {
      let claimedCandidate: ShowUpTenant | null = null;

      if (cleanEmail && FOUNDER_EMAILS.has(cleanEmail)) {
        const { data: founderTenant } = await supabase
          .from("showup_tenants")
          .select("*")
          .eq("id", FOUNDER_AIRTEL_TENANT_ID)
          .is("clerk_user_id", null)
          .maybeSingle();
        if (founderTenant) {
          claimedCandidate = founderTenant as ShowUpTenant;
        }
      }

      if (!claimedCandidate && cleanEmail) {
        const { data: emailMatch } = await supabase
          .from("showup_tenants")
          .select("*")
          .ilike("email", cleanEmail)
          .is("clerk_user_id", null)
          .neq("id", DEFAULT_TENANT_ID)
          .order("waba_status", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (emailMatch) {
          claimedCandidate = emailMatch as ShowUpTenant;
        }
      }

      if (!claimedCandidate && phoneE164) {
        const { data: phoneMatch } = await supabase
          .from("showup_tenants")
          .select("*")
          .eq("phone_e164", phoneE164)
          .is("clerk_user_id", null)
          .neq("id", DEFAULT_TENANT_ID)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (phoneMatch) {
          claimedCandidate = phoneMatch as ShowUpTenant;
        }
      }

      if (claimedCandidate) {
        const { data: updated, error: claimErr } = await supabase
          .from("showup_tenants")
          .update({
            clerk_user_id: clerkUserId,
            ...(!claimedCandidate.email && cleanEmail ? { email: cleanEmail } : {}),
          })
          .eq("id", claimedCandidate.id)
          .is("clerk_user_id", null)
          .select("*")
          .maybeSingle();

        if (!claimErr && updated) {
          return updated as ShowUpTenant;
        }
      }
    }

    // 3. Provision a fresh tenant for the new Clerk user
    const newTenant: ShowUpTenant = {
      id: crypto.randomUUID(),
      clerk_user_id: clerkUserId,
      business_name: cleanName ? `${cleanName}'s Live Room` : "ShowUp Host",
      email: cleanEmail,
      phone_e164: phoneE164 || "",
      waba_id: null,
      phone_number_id: null,
      display_phone_number: null,
      access_token: null,
      waba_status: "disconnected",
      connected_at: null,
      plan_tier: "pilot",
      registrant_limit: 150,
      registrants_used_this_month: 0,
      billing_cycle_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
      created_at: now,
    };

    const { data: inserted, error } = await supabase
      .from("showup_tenants")
      .insert(newTenant)
      .select("*")
      .single();

    if (!error && inserted) {
      const templates = seedSystemTemplatesForTenant(inserted.id);
      await supabase.from("showup_templates").upsert(
        templates.map(({ id: _unused, ...rest }) => rest),
        { onConflict: "tenant_id,name,language" }
      );
      return inserted as ShowUpTenant;
    }

    // Fallback if clerk_user_id column is not yet added in Supabase
    if (error && error.message?.includes("clerk_user_id")) {
      const { clerk_user_id: _omit, ...compatTenant } = newTenant;
      const { data: compatInserted } = await supabase
        .from("showup_tenants")
        .insert(compatTenant)
        .select("*")
        .single();
      if (compatInserted) {
        const templates = seedSystemTemplatesForTenant(compatInserted.id);
        await supabase.from("showup_templates").upsert(
          templates.map(({ id: _unused, ...rest }) => rest),
          { onConflict: "tenant_id,name,language" }
        );
        return compatInserted as ShowUpTenant;
      }
    }
  }

  // Local JSON DB fallback
  const db = readLocalDb();
  const byClerk = db.tenants.find((t) => t.clerk_user_id === clerkUserId);
  if (byClerk) return byClerk;

  const claimableLocal = db.tenants.find(
    (t) =>
      !t.clerk_user_id &&
      t.id !== DEFAULT_TENANT_ID &&
      ((cleanEmail && FOUNDER_EMAILS.has(cleanEmail) && t.id === FOUNDER_AIRTEL_TENANT_ID) ||
        (cleanEmail && t.email?.toLowerCase() === cleanEmail) ||
        (phoneE164 && t.phone_e164 === phoneE164))
  );
  if (claimableLocal) {
    claimableLocal.clerk_user_id = clerkUserId;
    if (!claimableLocal.email && cleanEmail) claimableLocal.email = cleanEmail;
    writeLocalDb(db);
    return claimableLocal;
  }

  const newLocalTenant: ShowUpTenant = {
    id: crypto.randomUUID(),
    clerk_user_id: clerkUserId,
    business_name: cleanName ? `${cleanName}'s Live Room` : "ShowUp Host",
    email: cleanEmail,
    phone_e164: phoneE164 || "",
    waba_id: null,
    phone_number_id: null,
    display_phone_number: null,
    access_token: null,
    waba_status: "disconnected",
    connected_at: null,
    plan_tier: "pilot",
    registrant_limit: 150,
    registrants_used_this_month: 0,
    billing_cycle_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    created_at: now,
  };

  db.tenants.push(newLocalTenant);
  db.templates.push(...seedSystemTemplatesForTenant(newLocalTenant.id));
  writeLocalDb(db);
  return newLocalTenant;
}

export async function updateTenantContactPhone(
  tenantId: string,
  phoneE164: string
): Promise<void> {
  const supabaseReady = await checkSupabaseMigrationStatus();
  if (supabaseReady && supabase) {
    await supabase
      .from("showup_tenants")
      .update({ phone_e164: phoneE164 })
      .eq("id", tenantId);
    return;
  }

  const db = readLocalDb();
  const target = db.tenants.find((t) => t.id === tenantId);
  if (target) {
    target.phone_e164 = phoneE164;
    writeLocalDb(db);
  }
}

export async function getActiveTenant(explicitTenantId?: string | null): Promise<{
  tenant: ShowUpTenant;
  supabaseReady: boolean;
  isGuest: boolean;
}> {
  const supabaseReady = await checkSupabaseMigrationStatus();

  if (explicitTenantId && explicitTenantId !== "guest") {
    const found = await getTenantById(explicitTenantId);
    if (found) {
      return { tenant: found, supabaseReady, isGuest: false };
    }
  }

  let clerkUserId: string | null = null;
  try {
    const authResult = await auth();
    clerkUserId = authResult.userId || null;
  } catch {
    clerkUserId = null;
  }

  if (clerkUserId) {
    let email: string | null = null;
    let fullName: string | null = null;
    let phoneE164: string | null = null;

    try {
      const user = await currentUser();
      if (user) {
        email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress ||
          null;
        fullName =
          user.fullName ||
          [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
          null;
        const rawPhone =
          user.primaryPhoneNumber?.phoneNumber ||
          user.phoneNumbers?.[0]?.phoneNumber ||
          null;
        if (rawPhone) {
          phoneE164 = normalizeKenyanPhone(rawPhone);
        }
      }
    } catch {
      // Proceed with clerkUserId if currentUser() is unavailable
    }

    const tenant = await findOrCreateTenantByClerkUser({
      clerkUserId,
      email,
      fullName,
      phoneE164,
    });
    return { tenant, supabaseReady, isGuest: false };
  }

  // Unauthenticated / guest fallback
  const now = new Date().toISOString();
  const guestTenant: ShowUpTenant = {
    id: "guest",
    business_name: "Your Live Room",
    email: "",
    phone_e164: "",
    waba_id: null,
    phone_number_id: null,
    display_phone_number: null,
    access_token: null,
    waba_status: "disconnected",
    connected_at: null,
    plan_tier: "pilot",
    registrant_limit: 150,
    registrants_used_this_month: 0,
    billing_cycle_end: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
    created_at: now,
  };

  return { tenant: guestTenant, supabaseReady, isGuest: true };
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

export async function findOtherTenantByPhoneNumberId(
  phoneNumberId: string,
  excludeTenantId: string
): Promise<ShowUpTenant | null> {
  if (!phoneNumberId) return null;
  const supabaseReady = await checkSupabaseMigrationStatus();

  if (supabaseReady && supabase) {
    const { data } = await supabase
      .from("showup_tenants")
      .select("*")
      .eq("phone_number_id", phoneNumberId)
      .eq("waba_status", "connected")
      .neq("id", excludeTenantId)
      .neq("id", DEFAULT_TENANT_ID)
      .limit(1)
      .maybeSingle();
    return (data as ShowUpTenant) || null;
  }

  const db = readLocalDb();
  return (
    db.tenants.find(
      (t) =>
        t.phone_number_id === phoneNumberId &&
        t.waba_status === "connected" &&
        t.id !== excludeTenantId &&
        t.id !== DEFAULT_TENANT_ID
    ) || null
  );
}

export async function updateTenantProfile(
  tenantId: string,
  updates: { business_name?: string; phone_e164?: string }
): Promise<ShowUpTenant | null> {
  const cleanUpdates: Record<string, string> = {};
  if (updates.business_name !== undefined) {
    cleanUpdates.business_name = updates.business_name;
  }
  if (updates.phone_e164 !== undefined) {
    cleanUpdates.phone_e164 = updates.phone_e164;
  }

  const supabaseReady = await checkSupabaseMigrationStatus();
  if (supabaseReady && supabase) {
    const { data, error } = await supabase
      .from("showup_tenants")
      .update(cleanUpdates)
      .eq("id", tenantId)
      .select("*")
      .maybeSingle();
    if (!error && data) return data as ShowUpTenant;
  }

  const db = readLocalDb();
  const target = db.tenants.find((t) => t.id === tenantId);
  if (!target) return null;
  if (updates.business_name !== undefined) {
    target.business_name = updates.business_name;
  }
  if (updates.phone_e164 !== undefined) {
    target.phone_e164 = updates.phone_e164;
  }
  writeLocalDb(db);
  return target;
}

export async function disconnectTenantWaba(
  tenantId: string
): Promise<ShowUpTenant | null> {
  const supabaseReady = await checkSupabaseMigrationStatus();

  if (supabaseReady && supabase) {
    const { data, error } = await supabase
      .from("showup_tenants")
      .update({
        waba_id: null,
        phone_number_id: null,
        display_phone_number: null,
        access_token: null,
        waba_status: "disconnected",
        connected_at: null,
      })
      .eq("id", tenantId)
      .select("*")
      .maybeSingle();

    try {
      await supabase
        .from("showup_events")
        .update({ sender_mode: "shared_showup" })
        .eq("tenant_id", tenantId)
        .eq("sender_mode", "own_waba");
    } catch {
      // Ignore if sender_mode column is absent on legacy schema
    }

    if (!error && data) return data as ShowUpTenant;
  }

  const db = readLocalDb();
  const target = db.tenants.find((t) => t.id === tenantId);
  if (!target) return null;
  target.waba_id = null;
  target.phone_number_id = null;
  target.display_phone_number = null;
  target.access_token = null;
  target.waba_status = "disconnected";
  target.connected_at = null;
  for (const ev of db.events) {
    if (ev.tenant_id === tenantId && ev.sender_mode === "own_waba") {
      ev.sender_mode = "shared_showup";
    }
  }
  writeLocalDb(db);
  return target;
}

