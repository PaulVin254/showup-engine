export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import {
  checkSupabaseMigrationStatus,
  readLocalDb,
  supabase,
  writeLocalDb,
} from "@/lib/store";
import { formatEatDate } from "@/lib/default-templates";

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderWaitingRoomHtml({
  eventTitle,
  hostName,
  startsAtIso,
  token,
}: {
  eventTitle: string;
  hostName: string;
  startsAtIso: string;
  token: string;
}): string {
  const eat = formatEatDate(startsAtIso);
  const safeTitle = escapeHtml(eventTitle);
  const safeHost = escapeHtml(hostName || "Your host");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} · Waiting Room</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0b0d11;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      width: 100%;
      max-w: 480px;
      background: #13161c;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 32px 28px;
      box-shadow: 0 24px 60px -12px rgba(0, 0, 0, 0.7);
      text-align: center;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 5px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      background: rgba(0, 168, 132, 0.12);
      color: #00a884;
      border: 1px solid rgba(0, 168, 132, 0.28);
      margin-bottom: 20px;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #00a884;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.35; transform: scale(0.8); }
    }
    h1 {
      font-size: 22px;
      line-height: 1.25;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
    }
    .host {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .clock-box {
      background: #0d0f13;
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 22px;
    }
    .clock-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 6px;
    }
    .clock-digits {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 28px;
      font-weight: 600;
      color: #ffffff;
      letter-spacing: -0.02em;
    }
    .schedule-time {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 6px;
    }
    .explainer {
      font-size: 12.5px;
      line-height: 1.5;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 500;
      color: #ffffff;
      background: #1877f2;
      border: none;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn:hover { background: #2e86f8; }
    .status-poll {
      margin-top: 14px;
      font-size: 11px;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .spinner {
      width: 11px;
      height: 11px;
      border: 1.5px solid rgba(255, 255, 255, 0.2);
      border-top-color: #1877f2;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .footer {
      margin-top: 24px;
      font-size: 11px;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="dot"></span>
      <span>Doors opening shortly</span>
    </div>

    <h1>${safeTitle}</h1>
    <div class="host">Hosted by ${safeHost}</div>

    <div class="clock-box">
      <div class="clock-label">Live session starts in</div>
      <div class="clock-digits" id="timer">--:--:--</div>
      <div class="schedule-time">${escapeHtml(eat.fullStr)}</div>
    </div>

    <p class="explainer">
      Your seat is confirmed! Your host is setting up the live room now. Keep this tab open—we will automatically bring you into the room the moment doors open.
    </p>

    <button type="button" class="btn" id="refreshBtn" onclick="checkStatus(true)">
      Check &amp; Enter Room Now
    </button>

    <div class="status-poll">
      <span class="spinner"></span>
      <span id="pollText">Auto-connecting as soon as doors open…</span>
    </div>
  </div>

  <div class="footer">
    ShowUp · WhatsApp Live Access Engine
  </div>

  <script>
    const targetMs = new Date("${startsAtIso}").getTime();
    const token = "${token}";
    let redirecting = false;

    function updateTimer() {
      const diff = targetMs - Date.now();
      const el = document.getElementById("timer");
      if (diff <= 0) {
        el.innerText = "Starting now";
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.innerText =
        (h > 0 ? String(h).padStart(2, "0") + ":" : "") +
        String(m).padStart(2, "0") + ":" +
        String(s).padStart(2, "0");
    }

    updateTimer();
    setInterval(updateTimer, 1000);

    async function checkStatus(manual) {
      if (redirecting) return;
      const pollText = document.getElementById("pollText");
      if (manual && pollText) pollText.innerText = "Checking room status…";
      try {
        const res = await fetch("/j/" + token + "?check=1", { credentials: "omit" });
        const data = await res.json();
        if (data && data.joinUrl) {
          redirecting = true;
          if (pollText) pollText.innerText = "Doors open! Redirecting to live room…";
          window.location.href = data.joinUrl;
        } else if (manual && pollText) {
          pollText.innerText = "Host is still preparing the room. Retrying automatically…";
        }
      } catch (e) {
        // network retry
      }
    }

    setInterval(() => checkStatus(false), 5000);
  </script>
</body>
</html>`;
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const url = new URL(req.url);
  const isCheckPoll =
    url.searchParams.get("check") === "1" ||
    req.headers.get("accept")?.includes("application/json");

  const nowIso = new Date().toISOString();
  const supabaseReady = await checkSupabaseMigrationStatus();

  let eventTitle = "Live Masterclass";
  let hostName = "Host";
  let startsAtIso = nowIso;
  let joinUrl = "";

  if (supabaseReady && supabase) {
    const { data: reg } = await supabase
      .from("showup_registrants")
      .select("*, showup_events(id, title, host_name, starts_at, join_url)")
      .eq("tracking_token", token)
      .maybeSingle();

    if (reg) {
      // Mark clicked join link
      await supabase
        .from("showup_registrants")
        .update({
          clicked_join_link: true,
          joined_at: reg.joined_at || nowIso,
        })
        .eq("id", reg.id);

      const ev = reg.showup_events as
        | {
            id?: string;
            title?: string;
            host_name?: string;
            starts_at?: string;
            join_url?: string;
          }
        | null;

      if (ev) {
        eventTitle = ev.title || eventTitle;
        hostName = ev.host_name || hostName;
        startsAtIso = ev.starts_at || startsAtIso;
        joinUrl = (ev.join_url || "").trim();
      }
    }
  } else {
    const db = readLocalDb();
    const reg = db.registrants.find((r) => r.tracking_token === token);

    if (reg) {
      reg.clicked_join_link = true;
      reg.joined_at = reg.joined_at || nowIso;
      writeLocalDb(db);

      const ev = db.events.find((e) => e.id === reg.event_id);
      if (ev) {
        eventTitle = ev.title || eventTitle;
        hostName = ev.host_name || hostName;
        startsAtIso = ev.starts_at || startsAtIso;
        joinUrl = (ev.join_url || "").trim();
      }
    }
  }

  // If poller is checking whether link has been added
  if (isCheckPoll) {
    return NextResponse.json({
      ready: Boolean(joinUrl),
      joinUrl: joinUrl || null,
    });
  }

  // If host has configured their live meeting URL, redirect immediately
  if (joinUrl && /^https?:\/\//i.test(joinUrl)) {
    return NextResponse.redirect(joinUrl, 302);
  }

  // Otherwise, render the branded attendee waiting room with 5s auto-polling
  const html = renderWaitingRoomHtml({
    eventTitle,
    hostName,
    startsAtIso,
    token,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
