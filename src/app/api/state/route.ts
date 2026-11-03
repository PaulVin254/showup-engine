import { NextResponse } from "next/server";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { tenant, supabaseReady } = await getActiveTenant();

    if (supabaseReady && supabase) {
      const [eventsRes, templatesRes, registrantsRes, messagesRes, paymentsRes] =
        await Promise.all([
          supabase
            .from("showup_events")
            .select("*")
            .eq("tenant_id", tenant.id)
            .order("starts_at", { ascending: true }),
          supabase
            .from("showup_templates")
            .select("*")
            .eq("tenant_id", tenant.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("showup_registrants")
            .select("*")
            .eq("tenant_id", tenant.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("showup_scheduled_messages")
            .select("*")
            .eq("tenant_id", tenant.id)
            .order("scheduled_for", { ascending: true }),
          supabase
            .from("showup_payments")
            .select("*")
            .eq("tenant_id", tenant.id)
            .order("created_at", { ascending: false }),
        ]);

      return NextResponse.json({
        supabaseReady: true,
        tenant,
        events: eventsRes.data || [],
        templates: templatesRes.data || [],
        registrants: registrantsRes.data || [],
        scheduled_messages: messagesRes.data || [],
        payments: paymentsRes.data || [],
        metaConfigId: process.env.NEXT_PUBLIC_META_CONFIG_ID || "1433645942194259",
        metaAppId: process.env.NEXT_PUBLIC_META_APP_ID || "",
      });
    }

    const db = readLocalDb();
    const supabaseCheck = await checkSupabaseMigrationStatus();

    return NextResponse.json({
      supabaseReady: supabaseCheck,
      tenant: db.tenants[0],
      events: db.events,
      templates: db.templates,
      registrants: db.registrants,
      scheduled_messages: db.scheduled_messages,
      payments: db.payments,
      metaConfigId: process.env.NEXT_PUBLIC_META_CONFIG_ID || "1433645942194259",
      metaAppId: process.env.NEXT_PUBLIC_META_APP_ID || "",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed loading workspace state" },
      { status: 500 }
    );
  }
}

