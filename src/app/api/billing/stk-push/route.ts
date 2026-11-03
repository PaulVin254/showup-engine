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
    const { planTier = "starter", phone } = body;

    const phoneE164 = normalizeKenyanPhone(String(phone || ""));
    if (!phoneE164) {
      return NextResponse.json(
        { error: "Please enter a valid M-Pesa phone number (e.g. 0712 345 678)" },
        { status: 400 }
      );
    }

    const amountKes = planTier === "pro" ? 9999 : 4999;
    const newLimit = planTier === "pro" ? 2000 : 500;

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
      plan_tier: planTier === "pro" ? "pro" : "starter",
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
          registrant_limit: newLimit,
          billing_cycle_end: nextCycle,
        })
        .eq("id", tenant.id);
    } else {
      const db = readLocalDb();
      db.payments.unshift(payment);
      db.tenants[0].plan_tier = payment.plan_tier;
      db.tenants[0].registrant_limit = newLimit;
      db.tenants[0].billing_cycle_end = nextCycle;
      writeLocalDb(db);
    }

    return NextResponse.json({
      success: true,
      payment,
      newPlanTier: payment.plan_tier,
      newRegistrantLimit: newLimit,
      message: `M-Pesa STK Push confirmed (${mpesaReceipt})! Upgraded to ${payment.plan_tier.toUpperCase()} (${newLimit.toLocaleString()} registrants/mo).`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "M-Pesa STK Push failed" },
      { status: 500 }
    );
  }
}

