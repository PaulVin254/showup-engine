export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { normalizeJoinUrl } from "@/lib/pipeline";
import {
  checkSupabaseMigrationStatus,
  findOrCreateTenantByPhone,
  getActiveTenant,
  readLocalDb,
  supabase,
  TENANT_COOKIE_NAME,
  writeLocalDb,
} from "@/lib/store";
import { ShowUpEvent } from "@/lib/types";

function withTenantCookie(res: NextResponse, tenantId: string): NextResponse {
  if (tenantId && tenantId !== "guest") {
    res.cookies.set(TENANT_COOKIE_NAME, tenantId, {
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      sameSite: "lax",
    });
  }
  return res;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      hostName,
      hostPhone,
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

    if (!title || !startsAt) {
      return NextResponse.json(
        { error: "Title and startsAt are required" },
        { status: 400 }
      );
    }

    let { tenant, isGuest } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    const normalizedHostPhone = hostPhone
      ? normalizeKenyanPhone(String(hostPhone))
      : null;

    if (normalizedHostPhone) {
      tenant = await findOrCreateTenantByPhone({
        phoneE164: normalizedHostPhone,
        hostName: hostName || undefined,
      });
      isGuest = false;
    } else if (isGuest) {
      return NextResponse.json(
        {
          error:
            "Please enter your Host WhatsApp number so we can save your live room.",
        },
        { status: 400 }
      );
    }

    const baseSlug = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const sanitizedJoinUrl = joinUrl ? normalizeJoinUrl(String(joinUrl)) : "";

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
      join_url: sanitizedJoinUrl,
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
        if (!error && data) {
          return withTenantCookie(
            NextResponse.json({ event: data, tenant }),
            tenant.id
          );
        }
      }

      // Try inserting full event payload
      const { data, error } = await supabase
        .from("showup_events")
        .insert(newEvent)
        .select("*")
        .single();

      if (!error && data) {
        return withTenantCookie(
          NextResponse.json({ event: data, tenant }),
          tenant.id
        );
      }

      // Fallback: If table has not run the latest ALTER TABLE for is_paid/sender_mode, omit them
      if (error && error.message?.includes("column")) {
        const { is_paid: _p, sender_mode: _s, paid_pass_tier: _t, mpesa_receipt: _m, ...compatibleEvent } = newEvent;
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("showup_events")
          .insert(compatibleEvent)
          .select("*")
          .single();

        if (!fallbackError && fallbackData) {
          return withTenantCookie(
            NextResponse.json({
              event: {
                ...fallbackData,
                is_paid: Boolean(isPaid),
                sender_mode: senderMode,
              },
              tenant,
            }),
            tenant.id
          );
        }
        throw new Error(fallbackError?.message || error.message);
      }

      if (error) throw new Error(error.message);
      return withTenantCookie(
        NextResponse.json({ event: data, tenant }),
        tenant.id
      );
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
        return withTenantCookie(
          NextResponse.json({ event: db.events[existingIdx], tenant }),
          tenant.id
        );
      }
    }
    db.events.unshift(newEvent);
    writeLocalDb(db);

    return withTenantCookie(
      NextResponse.json({ event: newEvent, tenant }),
      tenant.id
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed creating event" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const eventId = url.searchParams.get("id");
    const cleanup = url.searchParams.get("cleanup");
    const keepId = url.searchParams.get("keepId");

    const { tenant } = await getActiveTenant();
    const supabaseReady = await checkSupabaseMigrationStatus();

    // Mode A: Clean up empty test events
    if (cleanup === "empty") {
      if (supabaseReady && supabase) {
        const { data: allEvents } = await supabase
          .from("showup_events")
          .select("id")
          .eq("tenant_id", tenant.id);

        const { data: allRegistrants } = await supabase
          .from("showup_registrants")
          .select("event_id")
          .eq("tenant_id", tenant.id);

        const registeredEventIds = new Set(
          (allRegistrants || []).map((r) => r.event_id)
        );

        const targetEventIds = (allEvents || [])
          .map((e) => e.id)
          .filter((id) => id !== keepId && !registeredEventIds.has(id));

        if (targetEventIds.length > 0) {
          await supabase
            .from("showup_scheduled_messages")
            .delete()
            .in("event_id", targetEventIds);

          await supabase
            .from("showup_events")
            .delete()
            .in("id", targetEventIds);
        }

        return NextResponse.json({
          success: true,
          deletedCount: targetEventIds.length,
        });
      }

      // Local DB fallback
      const db = readLocalDb();
      const registeredEventIds = new Set(db.registrants.map((r) => r.event_id));
      const targetEvents = db.events.filter(
        (e) =>
          (tenant.id === "guest" || e.tenant_id === tenant.id) &&
          e.id !== keepId &&
          !registeredEventIds.has(e.id)
      );
      const targetIds = new Set(targetEvents.map((e) => e.id));

      db.events = db.events.filter((e) => !targetIds.has(e.id));
      db.scheduled_messages = db.scheduled_messages.filter(
        (m) => !targetIds.has(m.event_id)
      );
      writeLocalDb(db);

      return NextResponse.json({
        success: true,
        deletedCount: targetEvents.length,
      });
    }

    // Mode B: Single event deletion
    if (!eventId) {
      return NextResponse.json({ error: "Missing event id" }, { status: 400 });
    }

    if (supabaseReady && supabase) {
      await supabase
        .from("showup_scheduled_messages")
        .delete()
        .eq("event_id", eventId);

      await supabase
        .from("showup_registrants")
        .delete()
        .eq("event_id", eventId);

      const { error } = await supabase
        .from("showup_events")
        .delete()
        .eq("id", eventId)
        .eq("tenant_id", tenant.id);

      if (error) throw new Error(error.message);

      return NextResponse.json({ success: true, deletedId: eventId });
    }

    const db = readLocalDb();
    db.events = db.events.filter((e) => e.id !== eventId);
    db.registrants = db.registrants.filter((r) => r.event_id !== eventId);
    db.scheduled_messages = db.scheduled_messages.filter(
      (m) => m.event_id !== eventId
    );
    writeLocalDb(db);

    return NextResponse.json({ success: true, deletedId: eventId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete event" },
      { status: 500 }
    );
  }
}

