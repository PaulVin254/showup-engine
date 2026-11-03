import { NextResponse } from "next/server";
import {
  checkSupabaseMigrationStatus,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const nowIso = new Date().toISOString();
  const supabaseReady = await checkSupabaseMigrationStatus();

  if (supabaseReady && supabase) {
    const { data: reg } = await supabase
      .from("showup_registrants")
      .select("*, showup_events(join_url)")
      .eq("tracking_token", token)
      .maybeSingle();

    if (reg) {
      await supabase
        .from("showup_registrants")
        .update({
          clicked_join_link: true,
          joined_at: reg.joined_at || nowIso,
        })
        .eq("id", reg.id);

      const joinUrl =
        (reg.showup_events as { join_url?: string } | null)?.join_url ||
        "https://meet.google.com";
      return NextResponse.redirect(joinUrl, 302);
    }
  }

  const db = readLocalDb();
  const reg = db.registrants.find((r) => r.tracking_token === token);

  if (reg) {
    reg.clicked_join_link = true;
    reg.joined_at = reg.joined_at || nowIso;
    writeLocalDb(db);

    const event = db.events.find((e) => e.id === reg.event_id);
    if (event?.join_url) {
      return NextResponse.redirect(event.join_url, 302);
    }
  }

  return NextResponse.redirect("https://meet.google.com", 302);
}

