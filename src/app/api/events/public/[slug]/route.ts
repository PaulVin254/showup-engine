export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  checkSupabaseMigrationStatus,
  readLocalDb,
  supabase,
} from "@/lib/store";
import { ShowUpEvent } from "@/lib/types";

function toPublicEvent(ev: ShowUpEvent) {
  return {
    id: ev.id,
    title: ev.title,
    slug: ev.slug,
    host_name: ev.host_name,
    teaser_hook: ev.teaser_hook,
    starts_at: ev.starts_at,
    timezone: ev.timezone,
    status: ev.status,
  };
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const cleanSlug = decodeURIComponent(slug || "").trim();
    if (!cleanSlug) {
      return NextResponse.json({ error: "Missing event slug" }, { status: 400 });
    }

    const supabaseReady = await checkSupabaseMigrationStatus();
    let found: ShowUpEvent | undefined;

    if (supabaseReady && supabase) {
      const { data: bySlug } = await supabase
        .from("showup_events")
        .select("id,title,slug,host_name,teaser_hook,starts_at,timezone,status")
        .eq("slug", cleanSlug)
        .maybeSingle();

      if (bySlug) {
        found = bySlug as ShowUpEvent;
      } else {
        const { data: byId } = await supabase
          .from("showup_events")
          .select("id,title,slug,host_name,teaser_hook,starts_at,timezone,status")
          .eq("id", cleanSlug)
          .maybeSingle();
        if (byId) found = byId as ShowUpEvent;
      }
    } else {
      const db = readLocalDb();
      found = db.events.find((e) => e.slug === cleanSlug || e.id === cleanSlug);
    }

    if (!found) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event: toPublicEvent(found) });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed loading event" },
      { status: 500 }
    );
  }
}
