export const dynamic = "force-dynamic";

import crypto from "crypto";
import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  DEFAULT_TENANT_ID,
  checkSupabaseMigrationStatus,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";

const VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "showup_secret_verify_token_2026";

function verifyMetaWebhookRequest(req: Request, rawBody: string): boolean {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return true;

  const forwardSecret = req.headers.get("x-webhook-secret");
  if (forwardSecret && forwardSecret === VERIFY_TOKEN) {
    return true;
  }

  const signature = req.headers.get("x-hub-signature-256");
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;

  const a = Buffer.from(signature, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

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
 * 2. Inbound "STOP" opt-out messages (cancels pending scheduled reminders)
 * 3. Quick-reply button clicks (e.g. "YES, I'll be there")
 * 4. Meta Lead Ads (`leadgen`) webhook notifications
 *
 * Supports both direct Meta payloads (`payload.entry`) and n8n-forwarded payloads (`payload.body.entry`).
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    if (!verifyMetaWebhookRequest(req, rawBody)) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
    const rawJson = JSON.parse(rawBody);
    // Unwrap raw Meta format or n8n wrapped format ($json.body)
    const payload = rawJson?.entry ? rawJson : rawJson?.body || rawJson;
    const supabaseReady = await checkSupabaseMigrationStatus();
    const db = readLocalDb();
    let dirty = false;

    for (const entry of payload?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value;
        const incomingPhoneNumberId = String(
          value?.metadata?.phone_number_id || ""
        ).trim();
        const sharedPhoneNumberId =
          process.env.SHOWUP_SHARED_PHONE_NUMBER_ID || "1017704028092663";

        // 1. Handle WhatsApp Status Updates (sent -> delivered -> read -> failed)
        for (const statusObj of value?.statuses || []) {
          const wamid = statusObj.id;
          const status = statusObj.status; // 'sent' | 'delivered' | 'read' | 'failed'
          const nowIso = new Date().toISOString();

          if (wamid && ["sent", "delivered", "read", "failed"].includes(status)) {
            const firstErr = Array.isArray(statusObj.errors) ? statusObj.errors[0] : null;
            const errorDetail = firstErr
              ? [
                  firstErr.code ? `(#${firstErr.code})` : null,
                  firstErr.title || firstErr.message || null,
                  firstErr.error_data?.details || null,
                ]
                  .filter(Boolean)
                  .join(" ")
              : null;

            if (status === "failed") {
              console.error("[meta-webhook] Message delivery failed:", {
                wamid,
                recipient: statusObj.recipient_id,
                phoneNumberId: value?.metadata?.phone_number_id,
                error: errorDetail || statusObj.errors || "Unknown Meta delivery failure",
              });
            }

            if (supabaseReady && supabase) {
              const updateFields: Record<string, string> = { status };
              if (status === "delivered") updateFields.delivered_at = nowIso;
              if (status === "read") updateFields.read_at = nowIso;
              if (status === "failed" && errorDetail) {
                updateFields.error_message = errorDetail;
              }
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
                if (status === "failed" && errorDetail) {
                  target.error_message = errorDetail;
                }
                dirty = true;
              }
            }
          }
        }

        // 2. Handle Inbound Messages & Quick-Reply Button Taps
        for (const messageObj of value?.messages || []) {
          const fromPhone = normalizeKenyanPhone(messageObj.from || "");
          // Extract text cleanly across regular text, quick reply buttons, or interactive replies
          const textBody = String(
            messageObj?.text?.body ||
              messageObj?.button?.text ||
              messageObj?.interactive?.button_reply?.title ||
              ""
          )
            .trim()
            .toUpperCase();

          if (fromPhone) {
            // STOP / UNSUBSCRIBE Opt-Out Handling scoped to the receiving sender / tenant
            if (textBody === "STOP" || textBody === "UNSUBSCRIBE") {
              if (supabaseReady && supabase) {
                let ownWabaTenantId: string | null = null;
                if (
                  incomingPhoneNumberId &&
                  incomingPhoneNumberId !== sharedPhoneNumberId
                ) {
                  const { data: matchedTenant } = await supabase
                    .from("showup_tenants")
                    .select("id")
                    .eq("phone_number_id", incomingPhoneNumberId)
                    .eq("waba_status", "connected")
                    .neq("id", DEFAULT_TENANT_ID)
                    .limit(1)
                    .maybeSingle();
                  if (matchedTenant?.id) {
                    ownWabaTenantId = String(matchedTenant.id);
                  }
                }

                let regIds: string[] = [];

                if (ownWabaTenantId) {
                  const { data: matchedRegs } = await supabase
                    .from("showup_registrants")
                    .select("id")
                    .eq("phone_e164", fromPhone)
                    .eq("tenant_id", ownWabaTenantId);

                  regIds = (matchedRegs || []).map((r) => String(r.id));
                  if (regIds.length > 0) {
                    await supabase
                      .from("showup_registrants")
                      .update({ opted_out: true })
                      .in("id", regIds);
                  }
                } else {
                  let sharedEventIds: string[] = [];
                  const { data: sharedEvents, error: evErr } = await supabase
                    .from("showup_events")
                    .select("id")
                    .or("sender_mode.eq.shared_showup,sender_mode.is.null");

                  if (!evErr && sharedEvents) {
                    sharedEventIds = sharedEvents.map((e) => String(e.id));
                  } else {
                    const { data: ownWabaTenants } = await supabase
                      .from("showup_tenants")
                      .select("id")
                      .eq("waba_status", "connected")
                      .neq("id", DEFAULT_TENANT_ID);
                    const ownIds = new Set(
                      (ownWabaTenants || []).map((t) => String(t.id))
                    );
                    const { data: allEvents } = await supabase
                      .from("showup_events")
                      .select("id, tenant_id");
                    sharedEventIds = (allEvents || [])
                      .filter((e) => !ownIds.has(String(e.tenant_id)))
                      .map((e) => String(e.id));
                  }

                  if (sharedEventIds.length > 0) {
                    const { data: matchedRegs } = await supabase
                      .from("showup_registrants")
                      .select("id")
                      .eq("phone_e164", fromPhone)
                      .in("event_id", sharedEventIds);

                    regIds = (matchedRegs || []).map((r) => String(r.id));
                    if (regIds.length > 0) {
                      await supabase
                        .from("showup_registrants")
                        .update({ opted_out: true })
                        .in("id", regIds);
                    }
                  }
                }

                if (regIds.length > 0) {
                  await supabase
                    .from("showup_scheduled_messages")
                    .update({
                      status: "skipped",
                      error_message: "Registrant opted out via STOP",
                    })
                    .in("registrant_id", regIds)
                    .eq("status", "scheduled");
                }
              } else {
                const matchedTenant =
                  incomingPhoneNumberId &&
                  incomingPhoneNumberId !== sharedPhoneNumberId
                    ? db.tenants.find(
                        (t) =>
                          t.phone_number_id === incomingPhoneNumberId &&
                          t.waba_status === "connected" &&
                          t.id !== DEFAULT_TENANT_ID
                      )
                    : undefined;

                const regIds = new Set<string>();
                if (matchedTenant) {
                  for (const r of db.registrants) {
                    if (
                      r.phone_e164 === fromPhone &&
                      r.tenant_id === matchedTenant.id
                    ) {
                      r.opted_out = true;
                      regIds.add(r.id);
                      dirty = true;
                    }
                  }
                } else {
                  const sharedEventIds = new Set(
                    db.events
                      .filter((e) => e.sender_mode !== "own_waba")
                      .map((e) => e.id)
                  );
                  for (const r of db.registrants) {
                    if (
                      r.phone_e164 === fromPhone &&
                      sharedEventIds.has(r.event_id)
                    ) {
                      r.opted_out = true;
                      regIds.add(r.id);
                      dirty = true;
                    }
                  }
                }

                for (const m of db.scheduled_messages) {
                  if (regIds.has(m.registrant_id) && m.status === "scheduled") {
                    m.status = "skipped";
                    m.error_message = "Registrant opted out via STOP";
                    dirty = true;
                  }
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

    // Always return HTTP 200 inside 1 second so Meta/n8n never retries in loops
    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    console.error("Meta webhook error:", err);
    return NextResponse.json({ received: true });
  }
}

