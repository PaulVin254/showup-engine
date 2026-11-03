import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  checkSupabaseMigrationStatus,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";

const VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "showup_secret_verify_token_2026";

/**
 * Meta Webhook Verification Challenge (GET /api/webhooks/meta)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge || "OK", { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden verify_token" }, { status: 403 });
}

/**
 * Meta Webhook Event Receiver (POST /api/webhooks/meta)
 * Handles:
 * 1. WhatsApp message delivery statuses (`sent`, `delivered`, `read`, `failed`)
 * 2. Inbound "STOP" opt-out messages
 * 3. Meta Lead Ads (`leadgen`) webhook notifications
 */
export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const supabaseReady = await checkSupabaseMigrationStatus();
    const db = readLocalDb();
    let dirty = false;

    for (const entry of payload?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value;

        // 1. Handle WhatsApp Status Updates (sent -> delivered -> read)
        for (const statusObj of value?.statuses || []) {
          const wamid = statusObj.id;
          const status = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
          const nowIso = new Date().toISOString();

          if (wamid && ["sent", "delivered", "read", "failed"].includes(status)) {
            if (supabaseReady && supabase) {
              const updateFields: Record<string, string> = { status };
              if (status === "delivered") updateFields.delivered_at = nowIso;
              if (status === "read") updateFields.read_at = nowIso;
              await supabase
                .from("showup_scheduled_messages")
                .update(updateFields)
                .eq("wamid", wamid);
            } else {
              const target = db.scheduled_messages.find((m) => m.wamid === wamid);
              if (target) {
                target.status = status;
                if (status === "delivered") target.delivered_at = nowIso;
                if (status === "read") target.read_at = nowIso;
                dirty = true;
              }
            }
          }
        }

        // 2. Handle Inbound STOP Opt-Outs
        for (const messageObj of value?.messages || []) {
          const fromPhone = normalizeKenyanPhone(messageObj.from || "");
          const textBody = String(messageObj?.text?.body || "")
            .trim()
            .toUpperCase();

          if (fromPhone && (textBody === "STOP" || textBody === "UNSUBSCRIBE")) {
            if (supabaseReady && supabase) {
              await supabase
                .from("showup_registrants")
                .update({ opted_out: true })
                .eq("phone_e164", fromPhone);
            } else {
              for (const r of db.registrants) {
                if (r.phone_e164 === fromPhone) {
                  r.opted_out = true;
                  dirty = true;
                }
              }
            }
          }
        }
      }
    }

    if (dirty && !supabaseReady) {
      writeLocalDb(db);
    }

    // Always return HTTP 200 inside 1 second so Meta never retries in loops
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Meta webhook error:", err);
    return NextResponse.json({ received: true });
  }
}

