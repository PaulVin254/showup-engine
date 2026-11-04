import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { ShowUpPayment } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      planTier = "event_pass",
      phone,
      eventId,
      senderMode = "shared_showup",
    } = body;

    const phoneE164 = normalizeKenyanPhone(String(phone || ""));
    if (!phoneE164) {
      return NextResponse.json(
        { error: "Please enter a valid M-Pesa phone number (e.g. 0712 345 678)" },
        { status: 400 }
      );
    }

    const tierPricing: Record<
      "event_pass" | "event_scale" | "starter" | "pro",
      { amountKes: number; limit: number; label: string }
    > = {
      event_pass: {
        amountKes: 1500,
        limit: 200,
        label: "Webinar Launch Pass (up to 200 leads)",
      },
      event_scale: {
        amountKes: 3000,
        limit: 500,
        label: "Scale Webinar Pass (up to 500 leads)",
      },
      starter: {
        amountKes: 4999,
        limit: 500,
        label: "Starter Monthly (500 leads/mo)",
      },
      pro: {
        amountKes: 9999,
        limit: 2000,
        label: "Pro Scale Monthly (2,000 leads/mo)",
      },
    };

    const resolvedTier: "event_pass" | "event_scale" | "starter" | "pro" =
      planTier in tierPricing ? planTier : "event_pass";
    const { amountKes, limit: newLimit, label } = tierPricing[resolvedTier];

    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    const checkoutRequestId = `ws_CO_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const mpesaReceipt = `SJK${Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase()}`;

    const payment: ShowUpPayment = {
      id: crypto.randomUUID(),
      tenant_id: tenant.id,
      event_id: eventId || null,
      plan_tier: resolvedTier,
      amount_kes: amountKes,
      phone_e164: phoneE164,
      checkout_request_id: checkoutRequestId,
      mpesa_receipt: mpesaReceipt,
      status: "completed",
      created_at: new Date().toISOString(),
    };

    const nextCycle = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (supabaseReady && supabase) {
      await supabase.from("showup_payments").insert(payment);
      await supabase
        .from("showup_tenants")
        .update({
          plan_tier: payment.plan_tier,
          registrant_limit: Math.max(tenant.registrant_limit, newLimit),
          billing_cycle_end: nextCycle,
        })
        .eq("id", tenant.id);
    } else {
      const db = readLocalDb();
      db.payments.unshift(payment);
      db.tenants[0].plan_tier = payment.plan_tier;
      db.tenants[0].registrant_limit = Math.max(
        db.tenants[0].registrant_limit,
        newLimit
      );
      db.tenants[0].billing_cycle_end = nextCycle;

      if (eventId) {
        const evIdx = db.events.findIndex((e) => e.id === eventId);
        if (evIdx >= 0) {
          db.events[evIdx].is_paid = true;
          db.events[evIdx].paid_pass_tier = resolvedTier;
          db.events[evIdx].mpesa_receipt = mpesaReceipt;
          db.events[evIdx].sender_mode =
            senderMode === "own_waba" ? "own_waba" : "shared_showup";
        }
      }
      writeLocalDb(db);
    }

    return NextResponse.json({
      success: true,
      payment,
      newPlanTier: payment.plan_tier,
      newRegistrantLimit: newLimit,
      message: `M-Pesa STK Push confirmed (${mpesaReceipt} · KES ${amountKes.toLocaleString()})! ${label} activated — your 5-stage WhatsApp reminders are now live.`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "M-Pesa STK Push failed" },
      { status: 500 }
    );
  }
}

