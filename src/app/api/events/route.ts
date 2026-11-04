import { NextResponse } from "next/server";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { ShowUpEvent } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      hostName,
      teaserHook,
      startsAt,
      joinUrl,
      metaFormId,
      stageTemplates,
      adSpendKes = 50000,
      baselineShowupRate = 20,
      offerPriceKes = 25000,
      expectedCloseRate = 5,
      isPaid = false,
      senderMode = "shared_showup",
      eventId,
    } = body;

    if (!title || !startsAt || !joinUrl) {
      return NextResponse.json(
        { error: "Title, startsAt, and joinUrl are required" },
        { status: 400 }
      );
    }

    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    const baseSlug = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const newEvent: ShowUpEvent = {
      id: crypto.randomUUID(),
      tenant_id: tenant.id,
      title,
      slug,
      host_name: hostName || tenant.business_name,
      teaser_hook:
        teaserHook || "the exact step-by-step framework to achieve results",
      starts_at: new Date(startsAt).toISOString(),
      timezone: "Africa/Nairobi",
      join_url: joinUrl,
      meta_form_id: metaFormId || null,
      webhook_secret: `whsec_${Math.random().toString(36).slice(2, 12)}`,
      stage_templates: stageTemplates || {
        instant_welcome: "event_registration_confirmed",
        calendar_link: "event_calendar_link",
        t_24h: "event_teaser_24h",
        t_1h: "event_starting_1h",
        live_now: "event_live_now",
      },
      ad_spend_kes: Number(adSpendKes) || 50000,
      baseline_showup_rate: Number(baselineShowupRate) || 20,
      offer_price_kes: Number(offerPriceKes) || 25000,
      expected_close_rate: Number(expectedCloseRate) || 5,
      status: "upcoming",
      is_paid: Boolean(isPaid),
      sender_mode: senderMode === "own_waba" ? "own_waba" : "shared_showup",
      created_at: new Date().toISOString(),
    };

    if (supabaseReady && supabase) {
      if (eventId) {
        const { data, error } = await supabase
          .from("showup_events")
          .update({
            title: newEvent.title,
            host_name: newEvent.host_name,
            teaser_hook: newEvent.teaser_hook,
            starts_at: newEvent.starts_at,
            join_url: newEvent.join_url,
          })
          .eq("id", eventId)
          .select("*")
          .single();
        if (!error && data) return NextResponse.json({ event: data });
      }
      const { data, error } = await supabase
        .from("showup_events")
        .insert(newEvent)
        .select("*")
        .single();

      if (error) throw new Error(error.message);
      return NextResponse.json({ event: data });
    }

    const db = readLocalDb();
    if (eventId) {
      const existingIdx = db.events.findIndex((e) => e.id === eventId);
      if (existingIdx >= 0) {
        db.events[existingIdx] = {
          ...db.events[existingIdx],
          title: newEvent.title,
          host_name: newEvent.host_name,
          teaser_hook: newEvent.teaser_hook,
          starts_at: newEvent.starts_at,
          join_url: newEvent.join_url,
          sender_mode: newEvent.sender_mode,
        };
        writeLocalDb(db);
        return NextResponse.json({ event: db.events[existingIdx] });
      }
    }
    db.events.unshift(newEvent);
    writeLocalDb(db);

    return NextResponse.json({ event: newEvent });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed creating event" },
      { status: 500 }
    );
  }
}

