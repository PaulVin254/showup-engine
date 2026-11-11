export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { normalizeKenyanPhone } from "@/lib/phone";
import { scheduleAndFireSequenceForRegistrant } from "@/lib/scheduler";
import {
  checkSupabaseMigrationStatus,
  getActiveTenant,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { ShowUpEvent, ShowUpRegistrant } from "@/lib/types";

export async function POST(
  req: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await req.json();
    const { rows = [], mode = "registrants" } = body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No CSV rows provided" }, { status: 400 });
    }

    const supabaseReady = await checkSupabaseMigrationStatus();

    const db = readLocalDb();
    let event: ShowUpEvent | undefined = db.events.find((e) => e.id === eventId);

    if (supabaseReady && supabase) {
      const { data } = await supabase
        .from("showup_events")
        .select("*")
        .eq("id", eventId)
        .maybeSingle();
      if (data) event = data as ShowUpEvent;
    }

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { tenant } = await getActiveTenant(event.tenant_id);

    // MODE A: Reconcile post-webinar Zoom / Google Meet Attendance CSV
    if (mode === "attendance_reconcile") {
      let matchedCount = 0;

      for (const row of rows) {
        const rawPhone = row.phone || row.Phone || "";
        const normPhone = normalizeKenyanPhone(String(rawPhone));
        const rawEmail = String(row.email || row.Email || "").toLowerCase().trim();
        const duration = Number(row.duration || row.Duration || 45);

        if (supabaseReady && supabase) {
          let query = supabase
            .from("showup_registrants")
            .update({
              clicked_join_link: true,
              zoom_verified: true,
              zoom_duration_minutes: duration,
              joined_at: new Date().toISOString(),
            })
            .eq("event_id", event.id);

          if (normPhone) {
            query = query.eq("phone_e164", normPhone);
          } else if (rawEmail) {
            query = query.ilike("email", rawEmail);
          } else {
            continue;
          }

          const { data } = await query.select("id");
          if (data && data.length > 0) matchedCount += data.length;
        } else {
          const match = db.registrants.find(
            (r) =>
              r.event_id === event!.id &&
              ((normPhone && r.phone_e164 === normPhone) ||
                (rawEmail && r.email?.toLowerCase() === rawEmail))
          );
          if (match) {
            match.clicked_join_link = true;
            match.zoom_verified = true;
            match.zoom_duration_minutes = duration;
            match.joined_at = match.joined_at || new Date().toISOString();
            matchedCount += 1;
          }
        }
      }

      if (!supabaseReady) writeLocalDb(db);

      return NextResponse.json({
        success: true,
        matchedCount,
        message: `Reconciled ${matchedCount} verified live attendees from Zoom/Meet CSV.`,
      });
    }

    // MODE B: Bulk Import Webinar Registrants & Schedule 5-Stage Sequences
    let importedCount = 0;
    let skippedCount = 0;

    for (const row of rows) {
      const fullName = String(
        row.name || row.full_name || row.Name || "Webinar Guest"
      ).trim();
      const rawPhone = String(row.phone || row.Phone || row.whatsapp || "");
      const email = String(row.email || row.Email || "").trim() || null;

      const phoneE164 = normalizeKenyanPhone(rawPhone);
      if (!phoneE164) {
        skippedCount += 1;
        continue;
      }

      const registrant: ShowUpRegistrant = {
        id: crypto.randomUUID(),
        event_id: event.id,
        tenant_id: tenant.id,
        full_name: fullName,
        phone_e164: phoneE164,
        email,
        source: "csv_import",
        meta_lead_id: null,
        tracking_token: `${Math.random().toString(36).slice(2, 8)}${importedCount}`,
        consent_given: true,
        opted_out: false,
        clicked_join_link: false,
        joined_at: null,
        zoom_verified: false,
        zoom_duration_minutes: 0,
        created_at: new Date().toISOString(),
      };

      if (supabaseReady && supabase) {
        const { data: saved } = await supabase
          .from("showup_registrants")
          .upsert(registrant, { onConflict: "event_id,phone_e164" })
          .select("*")
          .single();

        if (saved) {
          await scheduleAndFireSequenceForRegistrant({
            tenant,
            event,
            registrant: saved as ShowUpRegistrant,
          });
          importedCount += 1;
        }
      } else {
        const exists = db.registrants.some(
          (r) => r.event_id === event!.id && r.phone_e164 === phoneE164
        );
        if (!exists) {
          db.registrants.unshift(registrant);
          db.tenants[0].registrants_used_this_month += 1;
          writeLocalDb(db);
          await scheduleAndFireSequenceForRegistrant({
            tenant,
            event,
            registrant,
          });
          importedCount += 1;
        } else {
          skippedCount += 1;
        }
      }
    }

    return NextResponse.json({
      success: true,
      importedCount,
      skippedCount,
      message: `Imported ${importedCount} registrants and scheduled their 5-stage WhatsApp sequences!`,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "CSV operation failed" },
      { status: 500 }
    );
  }
}

