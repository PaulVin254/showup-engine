import { NextResponse } from "next/server";
import { seedSystemTemplatesForTenant } from "@/lib/default-templates";
import {
  getActiveTenant,
  readLocalDb,
  supabase,
} from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { tenant, supabaseReady, isGuest } = await getActiveTenant();

    if (isGuest) {
      return NextResponse.json({
        supabaseReady,
        isGuest: true,
        tenant,
        events: [],
        templates: seedSystemTemplatesForTenant("guest"),
        registrants: [],
        scheduled_messages: [],
        payments: [],
        metaConfigId: process.env.NEXT_PUBLIC_META_CONFIG_ID || "1433645942194259",
        metaAppId: process.env.NEXT_PUBLIC_META_APP_ID || "",
      });
    }

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
        isGuest: false,
        tenant,
        events: eventsRes.data || [],
        templates:
          templatesRes.data && templatesRes.data.length > 0
            ? templatesRes.data
            : seedSystemTemplatesForTenant(tenant.id),
        registrants: registrantsRes.data || [],
        scheduled_messages: messagesRes.data || [],
        payments: paymentsRes.data || [],
        metaConfigId: process.env.NEXT_PUBLIC_META_CONFIG_ID || "1433645942194259",
        metaAppId: process.env.NEXT_PUBLIC_META_APP_ID || "",
      });
    }

    const db = readLocalDb();

    return NextResponse.json({
      supabaseReady,
      isGuest: false,
      tenant,
      events: db.events.filter((e) => e.tenant_id === tenant.id),
      templates: db.templates.filter((t) => t.tenant_id === tenant.id),
      registrants: db.registrants.filter((r) => r.tenant_id === tenant.id),
      scheduled_messages: db.scheduled_messages.filter(
        (m) => m.tenant_id === tenant.id
      ),
      payments: db.payments.filter((p) => p.tenant_id === tenant.id),
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

