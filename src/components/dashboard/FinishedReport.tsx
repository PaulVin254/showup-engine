"use client";

import React, { useState } from "react";
import {
  Download,
  FileUp,
  Repeat,
  Share2,
  Check,
  Minus,
} from "lucide-react";
import { ShowUpEvent, ShowUpRegistrant, ShowUpScheduledMessage } from "@/lib/types";
import { fmtEat } from "@/lib/lifecycle";
import { computeMetrics } from "@/lib/pipeline";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { Button, SectionLabel, StatusPill, inputCls, labelCls } from "@/components/ui/kit";
import { SOURCE_LABEL } from "./CommandCenter";

interface FinishedReportProps {
  event: ShowUpEvent;
  registrants: ShowUpRegistrant[];
  messages: ShowUpScheduledMessage[];
  onExport: () => void;
  onReconcileFile: (file: File) => void;
  onShareReport: () => void;
  onDuplicate: () => void;
}

const kes = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;

export function FinishedReport({
  event,
  registrants,
  messages,
  onExport,
  onReconcileFile,
  onShareReport,
  onDuplicate,
}: FinishedReportProps) {
  const m = computeMetrics(registrants, messages);
  const [adSpend, setAdSpend] = useState(event.ad_spend_kes || 12000);
  const [offer, setOffer] = useState(event.offer_price_kes || 25000);
  const [close, setClose] = useState(event.expected_close_rate || 6);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const baselinePct = event.baseline_showup_rate || 18;
  const baselineAttendees = Math.max(1, Math.round((baselinePct / 100) * Math.max(m.total, 1)));
  const extra = Math.max(0, m.attended - baselineAttendees);
  const costNow = m.attended > 0 ? adSpend / m.attended : adSpend;
  const costBefore = adSpend / baselineAttendees;
  const extraRevenue = extra * (close / 100) * offer;

  const clickOnly = registrants.filter((r) => r.clicked_join_link && !r.zoom_verified).length;
  const zoomOnly = registrants.filter((r) => r.zoom_verified && !r.clicked_join_link).length;
  const both = registrants.filter((r) => r.zoom_verified && r.clicked_join_link).length;
  const noShow = m.total - clickOnly - zoomOnly - both;
  const durations = registrants.map((r) => r.zoom_duration_minutes || 0).filter(Boolean);
  const avgDur = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;

  const recon = [
    { label: "Link click + Zoom verified", n: both, bar: "bg-[#00a884]" },
    { label: "Link click only", n: clickOnly, bar: "bg-[#1877f2]" },
    { label: "Zoom verified only", n: zoomOnly, bar: "bg-[#5aa2ff]" },
    { label: "No-show", n: noShow, bar: "bg-slate-600" },
  ];

  const sorted = [...registrants].sort(
    (a, b) =>
      Number(b.clicked_join_link || b.zoom_verified) - Number(a.clicked_join_link || a.zoom_verified)
  );

  return (
    <div className="animate-rise">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill tone="slate">Completed</StatusPill>
            <span className="font-mono tabular-nums text-[11px] text-slate-500">
              {fmtEat(event.starts_at, { date: true })} EAT
            </span>
          </div>
          <h1 className="text-[19px] sm:text-[22px] leading-tight font-semibold tracking-tight text-white break-words sm:truncate">
            {event.title}
          </h1>
          <p className="text-[12.5px] text-slate-400">
            Attendance and ROI reconciliation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onReconcileFile(f);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} icon={<FileUp className="w-3.5 h-3.5" />}>
            Reconcile Zoom CSV
          </Button>
          <Button onClick={onExport} icon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>
          <Button onClick={onShareReport} icon={<Share2 className="w-3.5 h-3.5" />}>
            ROI report
          </Button>
          <Button variant="brand" onClick={onDuplicate} icon={<Repeat className="w-3.5 h-3.5" />}>
            Run again
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/[0.08] border-b border-white/[0.08] [&>*:nth-child(n+3)]:max-lg:border-t [&>*:nth-child(n+3)]:max-lg:border-white/[0.08]">
        {[
          { l: "Registered", v: String(m.total), s: `${m.optedOut} opted out`, t: "text-white" },
          { l: "Attended", v: String(m.attended), s: `+${extra} vs ${baselinePct}% baseline`, t: "text-[#00a884]" },
          { l: "Show-up rate", v: `${m.showupPct}%`, s: `baseline ${baselinePct}%`, t: m.showupPct > baselinePct ? "text-[#00a884]" : "text-white" },
          { l: "Avg. time in room", v: avgDur ? `${avgDur}m` : "—", s: avgDur ? `${durations.length} Zoom-verified` : "Upload Zoom CSV", t: "text-white" },
        ].map((x) => (
          <div key={x.l} className="px-4 sm:px-6 py-3.5 sm:py-4 min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 truncate">{x.l}</div>
            <div className={cn("mt-1.5 font-mono tabular-nums text-[22px] sm:text-[26px] leading-none font-medium", x.t)}>{x.v}</div>
            <div className="mt-1.5 text-[11.5px] text-slate-500 truncate">{x.s}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] lg:divide-x divide-white/[0.08]">
        <div className="min-w-0 divide-y divide-white/[0.08]">
          <section>
            <SectionLabel>Attendance reconciliation</SectionLabel>
            <ul className="px-4 py-3 space-y-3">
              {recon.map((r) => (
                <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_40px] items-center gap-3 text-[12.5px]">
                  <span className="text-slate-300 truncate">{r.label}</span>
                  <span className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <span
                      className={cn("block h-full rounded-full transition-all duration-500", r.bar)}
                      style={{ width: `${m.total ? (r.n / m.total) * 100 : 0}%` }}
                    />
                  </span>
                  <span className="text-right font-mono tabular-nums text-white">{r.n}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <SectionLabel right={<span className="text-[11px] text-slate-600 font-mono tabular-nums">{m.total} rows</span>}>
              Registrants
            </SectionLabel>
            <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead className="sticky top-0 bg-[#0f1115] text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <tr className="border-b border-white/[0.08]">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-2 py-2 font-medium">WhatsApp</th>
                    <th className="px-2 py-2 font-medium hidden sm:table-cell">Source</th>
                    <th className="px-2 py-2 font-medium text-center hidden sm:table-cell">Link</th>
                    <th className="px-2 py-2 font-medium text-center hidden sm:table-cell">Zoom</th>
                    <th className="px-4 py-2 font-medium text-right">Attended</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r) => {
                    const att = r.clicked_join_link || r.zoom_verified;
                    return (
                      <tr key={r.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                        <td className="px-4 py-2 text-white font-medium max-w-[140px] sm:max-w-none truncate">{r.full_name}</td>
                        <td className="px-2 py-2 font-mono tabular-nums text-slate-400 whitespace-nowrap">{formatPhoneDisplay(r.phone_e164)}</td>
                        <td className="px-2 py-2 text-slate-500 hidden sm:table-cell">{SOURCE_LABEL[r.source]}</td>
                        <td className="px-2 py-2 text-center hidden sm:table-cell">
                          {r.clicked_join_link ? <Check className="w-3.5 h-3.5 mx-auto text-[#00a884]" /> : <Minus className="w-3.5 h-3.5 mx-auto text-slate-700" />}
                        </td>
                        <td className="px-2 py-2 text-center font-mono tabular-nums text-slate-400 hidden sm:table-cell">
                          {r.zoom_verified ? `${r.zoom_duration_minutes ?? "✓"}${r.zoom_duration_minutes ? "m" : ""}` : <Minus className="w-3.5 h-3.5 mx-auto text-slate-700" />}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <StatusPill tone={att ? "emerald" : "slate"} dot={false}>
                            {att ? "YES" : "NO"}
                          </StatusPill>
                        </td>
                      </tr>
                    );
                  })}
                  {sorted.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        No registrants were recorded for this event.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="min-w-0 border-t lg:border-t-0 border-white/[0.08]">
          <SectionLabel>ROI</SectionLabel>
          <div className="p-4 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              {[
                { l: "Ad spend (KES)", v: adSpend, set: setAdSpend },
                { l: "Offer (KES)", v: offer, set: setOffer },
                { l: "Close %", v: close, set: setClose },
              ].map((f) => (
                <div key={f.l}>
                  <label className={cn(labelCls, "text-[11px] truncate")}>{f.l}</label>
                  <input
                    type="number"
                    min={0}
                    value={f.v}
                    onChange={(e) => f.set(Number(e.target.value) || 0)}
                    className={cn(inputCls, "font-mono tabular-nums px-2")}
                  />
                </div>
              ))}
            </div>
            <dl className="divide-y divide-white/[0.06] text-[12.5px]">
              <div className="flex items-baseline justify-between py-2.5">
                <dt className="text-slate-400">Cost per attendee</dt>
                <dd className="font-mono tabular-nums text-white">
                  {kes(costNow)}
                  <span className="ml-2 text-slate-600 line-through">{kes(costBefore)}</span>
                </dd>
              </div>
              <div className="flex items-baseline justify-between py-2.5">
                <dt className="text-slate-400">Extra people in the room</dt>
                <dd className="font-mono tabular-nums text-[#00a884]">+{extra}</dd>
              </div>
              <div className="flex items-baseline justify-between py-2.5">
                <dt className="text-slate-400">Est. extra revenue</dt>
                <dd className="font-mono tabular-nums text-white text-[15px] font-medium">{kes(extraRevenue)}</dd>
              </div>
              <div className="flex items-baseline justify-between py-2.5">
                <dt className="text-slate-400">Event pass</dt>
                <dd className="font-mono tabular-nums text-slate-300">KES 1,500</dd>
              </div>
            </dl>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Baseline assumes {baselinePct}% show-up on email/SMS-only reminders.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

