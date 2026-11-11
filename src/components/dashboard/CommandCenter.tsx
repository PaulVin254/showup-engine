"use client";

import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Circle,
  Copy,
  ExternalLink,
  FileUp,
  Loader2,
  Pencil,
  Play,
  Radio,
  Smartphone,
  Users,
  Webhook,
} from "lucide-react";
import {
  SequenceStage,
  ShowUpEvent,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
  ShowUpTemplate,
  ShowUpTenant,
} from "@/lib/types";
import {
  LIVE_TAIL_MS,
  fmtEat,
  pad2,
  relativeAgo,
  splitDuration,
} from "@/lib/lifecycle";
import {
  PIPELINE_STAGES,
  computeMetrics,
  stageTimingLabel,
  summarizeStage,
} from "@/lib/pipeline";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { Button, SPRING_SNAPPY, SectionLabel, StatusPill } from "@/components/ui/kit";
import { PhonePreview } from "./PhonePreview";

export const SOURCE_LABEL: Record<ShowUpRegistrant["source"], string> = {
  hosted_page: "Reg page",
  meta_lead_ad: "Meta lead",
  csv_import: "CSV",
  webhook: "Webhook",
  manual_test: "Manual",
};

interface CommandCenterProps {
  mode: "scheduled" | "live";
  event: ShowUpEvent;
  registrants: ShowUpRegistrant[];
  messages: ShowUpScheduledMessage[];
  templates: ShowUpTemplate[];
  tenant: ShowUpTenant;
  now: number;
  origin: string;
  dispatchingStage: string | null;
  sendingTest: boolean;
  onFireStage: (stage: SequenceStage) => void;
  onSendTest: (stage: SequenceStage) => void;
  onToast: (msg: string) => void;
  onOpenRegistrants: () => void;
  onEdit: () => void;
  onLaunch: () => void;
  onImportFile: (file: File) => void;
}

function Countdown({ ms }: { ms: number }) {
  const { d, h, m, s } = splitDuration(ms);
  const cells: Array<[string, string]> = [
    [String(d), "days"],
    [pad2(h), "hrs"],
    [pad2(m), "min"],
    [pad2(s), "sec"],
  ];
  return (
    <div className="flex items-end gap-1" aria-label="Time until start">
      {cells.map(([v, l], i) => (
        <React.Fragment key={l}>
          {i > 0 && <span className="pb-3 text-slate-700 font-mono text-lg">:</span>}
          <div className="min-w-[44px] text-center">
            <div className="font-mono tabular-nums text-[28px] leading-none font-medium text-white">
              {v}
            </div>
            <div className="mt-1.5 text-[10px] uppercase tracking-wider text-slate-500">{l}</div>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export function CommandCenter(props: CommandCenterProps) {
  const {
    mode,
    event,
    registrants,
    messages,
    templates,
    tenant,
    now,
    origin,
    dispatchingStage,
    sendingTest,
    onFireStage,
    onSendTest,
    onToast,
    onOpenRegistrants,
    onEdit,
    onLaunch,
    onImportFile,
  } = props;

  const [previewStage, setPreviewStage] = useState<SequenceStage>("instant_welcome");
  const [copied, setCopied] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const start = new Date(event.starts_at).getTime();
  const msToStart = start - now;
  const m = computeMetrics(registrants, messages);
  const paid = event.is_paid !== false;
  const regUrl = `${origin}/r/${event.slug}`;
  const addedToday = registrants.filter((r) => now - new Date(r.created_at).getTime() < 86400e3).length;

  const copy = (key: string, text: string, toast: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    onToast(toast);
    setTimeout(() => setCopied(null), 1600);
  };

  // First stage that has not completed → "Next"
  const summaries = PIPELINE_STAGES.map((s) => summarizeStage(messages, s.key));
  const nextIdx = summaries.findIndex((s) => s.state !== "done");

  const elapsed = now - start;
  const windowLeft = start + LIVE_TAIL_MS - now;

  const metrics =
    mode === "live"
      ? [
          { label: "In the room", value: String(m.attended), sub: `of ${m.total} registered`, tone: "text-[#00a884]" },
          { label: "Join-link CTR", value: `${m.showupPct}%`, sub: `${event.baseline_showup_rate || 18}% baseline`, tone: "text-white" },
          { label: "Not joined yet", value: String(m.notJoined), sub: "still reachable", tone: "text-white" },
          { label: "Failed sends", value: String(m.failed), sub: m.failed ? "needs attention" : "all clear", tone: m.failed ? "text-red-400" : "text-white" },
        ]
      : [
          { label: "Registrants", value: String(m.total), sub: addedToday ? `+${addedToday} in 24h` : `${m.optedOut} opted out`, tone: "text-white" },
          { label: "Messages sent", value: String(m.messagesSent), sub: `${PIPELINE_STAGES.length} stage sequence`, tone: "text-white" },
          { label: "Delivery rate", value: m.deliveryPct === null ? "—" : `${m.deliveryPct}%`, sub: m.failed ? `${m.failed} failed` : "no failures", tone: m.deliveryPct !== null && m.deliveryPct >= 90 ? "text-[#00a884]" : "text-white" },
          { label: "Read rate", value: m.readPct === null ? "—" : `${m.readPct}%`, sub: "of delivered", tone: "text-white" },
        ];

  const joined = registrants
    .filter((r) => r.clicked_join_link || r.zoom_verified)
    .sort((a, b) => new Date(b.joined_at || 0).getTime() - new Date(a.joined_at || 0).getTime());
  const recent = [...registrants]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);
  const feed = mode === "live" ? joined.slice(0, 8) : recent;

  return (
    <div className="animate-rise">
      {/* ---------------------------------------------------------- */}
      {/* Event header                                                */}
      {/* ---------------------------------------------------------- */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-white/[0.08] flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {mode === "live" ? (
              <StatusPill tone="red" pulse>Live room</StatusPill>
            ) : paid ? (
              <StatusPill tone="emerald">Scheduled</StatusPill>
            ) : (
              <StatusPill tone="amber">Draft · reminders paused</StatusPill>
            )}
            <span className="font-mono tabular-nums text-[11px] text-slate-500">
              {fmtEat(start, { date: true })} EAT
            </span>
          </div>
          <h1 className="text-[19px] sm:text-[22px] leading-tight font-semibold tracking-tight text-white break-words sm:truncate">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-slate-400">
            <a
              href={event.join_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-white transition max-w-[200px] sm:max-w-[240px]"
            >
              <span className="truncate">{event.join_url.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
            <button
              type="button"
              onClick={() => copy("reg", regUrl, "Registration link copied")}
              className="inline-flex items-center gap-1 font-mono hover:text-white transition max-w-full"
            >
              {copied === "reg" ? <Check className="w-3 h-3 text-[#00a884] shrink-0" /> : <Copy className="w-3 h-3 shrink-0" />}
              <span className="truncate">/r/{event.slug}</span>
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 hover:text-white transition"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
          </div>
        </div>

        <div className="shrink-0 lg:text-right">
          {mode === "live" ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 lg:justify-end text-[11px] uppercase tracking-wider text-slate-500">
                <Radio className="w-3.5 h-3.5 text-red-400" />
                {elapsed < 0 ? "Room opens at start" : "Elapsed since start"}
              </div>
              <div className="font-mono tabular-nums text-[28px] sm:text-[34px] leading-none font-medium text-white">
                {elapsed < 0
                  ? `−${pad2(Math.floor(-elapsed / 60000))}:${pad2(Math.floor((-elapsed % 60000) / 1000))}`
                  : `T+${pad2(Math.floor(elapsed / 60000))}:${pad2(Math.floor((elapsed % 60000) / 1000))}`}
              </div>
              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                monitor closes in {Math.max(0, Math.floor(windowLeft / 60000))}m
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Starts in · {fmtEat(start)} EAT
              </div>
              <Countdown ms={msToStart} />
            </div>
          )}
        </div>
      </div>

      {/* Draft launch bar */}
      {!paid && (
        <div className="px-4 sm:px-6 py-2.5 border-b border-amber-400/20 bg-amber-400/[0.04] flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-amber-100/90">
            <span className="font-medium">{m.total} registrants are queued.</span>{" "}
            <span className="text-amber-100/60">The sequence starts sending when you launch.</span>
          </p>
          <Button size="sm" variant="success" onClick={onLaunch} icon={<Smartphone className="w-3.5 h-3.5" />}>
            Launch · KES 1,500 via M-Pesa
          </Button>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Metrics strip                                               */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-white/[0.08] divide-x divide-white/[0.08] [&>*:nth-child(n+3)]:max-lg:border-t [&>*:nth-child(n+3)]:max-lg:border-white/[0.08]">
        {metrics.map((x) => (
          <div key={x.label} className="px-4 sm:px-6 py-3.5 sm:py-4 min-w-0">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 truncate">
              {x.label}
            </div>
            <div className={cn("mt-1.5 font-mono tabular-nums text-[22px] sm:text-[26px] leading-none font-medium", x.tone)}>
              {x.value}
            </div>
            <div className="mt-1.5 text-[11.5px] text-slate-500 truncate">{x.sub}</div>
          </div>
        ))}
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Split command view                                          */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] lg:divide-x divide-white/[0.08]">
        {/* LEFT: pipeline + actions + feed */}
        <div className="min-w-0 divide-y divide-white/[0.08]">
          <section>
            <SectionLabel right={<span className="text-[11px] text-slate-600">All times EAT</span>}>
              Sequence pipeline
            </SectionLabel>
            <ol>
              {PIPELINE_STAGES.map((st, i) => {
                const sum = summaries[i];
                const selected = previewStage === st.key;
                const isNext = i === nextIdx && paid;
                const pct = m.total > 0 ? Math.min(100, Math.round((sum.sent / m.total) * 100)) : 0;
                return (
                  <li key={st.key} className="group relative">
                    {selected && (
                      <motion.span
                        layoutId="pipeline-active-row"
                        transition={SPRING_SNAPPY}
                        className="absolute inset-0 bg-white/[0.035] border-l-2 border-l-[#1877f2] pointer-events-none"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewStage(st.key)}
                      className={cn(
                        "relative w-full grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition border-b border-white/[0.05] last:border-b-0",
                        !selected && "hover:bg-white/[0.02]"
                      )}
                    >
                      <span aria-hidden className="flex justify-center">
                        {sum.state === "done" ? (
                          <CheckCircle2 className="w-[18px] h-[18px] text-[#00a884]" />
                        ) : sum.state === "failed" ? (
                          <AlertCircle className="w-[18px] h-[18px] text-red-400" />
                        ) : sum.state === "partial" ? (
                          <Loader2 className="w-[18px] h-[18px] text-[#1877f2] animate-spin" />
                        ) : (
                          <Circle className={cn("w-[18px] h-[18px]", isNext ? "text-[#1877f2]" : "text-slate-700")} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-white">{st.label}</span>
                          {isNext && <StatusPill tone="blue" dot={false}>Next</StatusPill>}
                        </span>
                        <span className="block text-[11.5px] text-slate-500 font-mono tabular-nums truncate">
                          {stageTimingLabel(st, event)}
                        </span>
                      </span>
                      <span className="flex items-center gap-4">
                        <span className="hidden sm:block w-24">
                          <span className="block h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                            <span
                              className={cn("block h-full rounded-full transition-all duration-500", sum.failed ? "bg-red-400" : "bg-[#00a884]")}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                        </span>
                        <span className="w-[72px] text-right font-mono tabular-nums text-[12px] text-slate-400">
                          {sum.sent}
                          <span className="text-slate-600">/{m.total}</span>
                        </span>
                      </span>
                    </button>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition bg-[#0f1115] pl-2">
                      <Button
                        size="sm"
                        loading={dispatchingStage === st.key}
                        onClick={() => {
                          if (window.confirm(`Send "${st.label}" to all ${m.total} registrants now?`)) {
                            onFireStage(st.key);
                          }
                        }}
                        icon={<Play className="w-3 h-3" />}
                      >
                        Send now
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section>
            <SectionLabel>Quick actions</SectionLabel>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onImportFile(f);
                e.target.value = "";
              }}
            />
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
              {[
                {
                  icon: FileUp,
                  title: "Import CSV",
                  sub: "name, phone · +254 normalised",
                  onClick: () => fileRef.current?.click(),
                },
                {
                  icon: Webhook,
                  title: copied === "hook" ? "Endpoint copied" : "Meta lead sync",
                  sub: "Copy lead-ad webhook URL",
                  onClick: () =>
                    copy("hook", `${origin}/api/events/${event.id}/register`, "Lead webhook URL copied"),
                },
                {
                  icon: Smartphone,
                  title: paid ? "Event pass active" : "Launch via M-Pesa STK",
                  sub: paid
                    ? event.mpesa_receipt
                      ? `Receipt ${event.mpesa_receipt}`
                      : "Sequence is running"
                    : "KES 1,500 · 200 leads",
                  onClick: paid ? undefined : onLaunch,
                  tone: paid ? "emerald" : "blue",
                },
              ].map((a) => (
                <button
                  key={a.title}
                  type="button"
                  disabled={!a.onClick}
                  onClick={a.onClick}
                  className="flex items-start gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.025] disabled:hover:bg-transparent disabled:cursor-default"
                >
                  <a.icon
                    className={cn(
                      "w-4 h-4 mt-0.5 shrink-0",
                      a.tone === "emerald" ? "text-[#00a884]" : a.tone === "blue" ? "text-[#1877f2]" : "text-slate-400"
                    )}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-white">{a.title}</span>
                    <span className="block text-[11.5px] text-slate-500 truncate">{a.sub}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionLabel
              right={
                <button
                  type="button"
                  onClick={onOpenRegistrants}
                  className="inline-flex items-center gap-1 text-[11.5px] text-[#5aa2ff] hover:text-white transition"
                >
                  All {m.total}
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              }
            >
              {mode === "live" ? "Room entrants" : "Recent registrations"}
            </SectionLabel>
            {feed.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Users className="w-4 h-4 mx-auto text-slate-600" />
                <p className="mt-2 text-[12.5px] text-slate-400">
                  {mode === "live" ? "No one has clicked the join link yet." : "No registrants yet."}
                </p>
                {mode === "scheduled" && (
                  <p className="text-[11.5px] text-slate-600 mt-0.5">
                    Share the registration link or import a CSV to start the sequence.
                  </p>
                )}
              </div>
            ) : (
              <ul>
                {feed.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center gap-3 px-4 py-2.5 border-b border-white/[0.05] last:border-b-0 text-[12.5px] animate-rise"
                  >
                    <span className="w-6 h-6 rounded-full bg-white/[0.06] text-[10.5px] font-medium text-slate-300 flex items-center justify-center shrink-0">
                      {r.full_name.charAt(0).toUpperCase()}
                    </span>
                    <span className="text-white font-medium truncate min-w-0 flex-1">{r.full_name}</span>
                    <span className="hidden sm:block font-mono tabular-nums text-slate-500">
                      {formatPhoneDisplay(r.phone_e164)}
                    </span>
                    <span className="text-slate-500 w-16 text-right">{SOURCE_LABEL[r.source]}</span>
                    <span className="w-16 text-right font-mono tabular-nums text-slate-500">
                      {mode === "live" && r.joined_at ? fmtEat(r.joined_at) : relativeAgo(r.created_at, now)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* RIGHT: native WhatsApp preview */}
        <div className="min-w-0 p-4 sm:p-5 border-t lg:border-t-0 border-white/[0.08] lg:sticky lg:top-12 lg:self-start">
          <PhonePreview
            event={event}
            templates={templates}
            senderName={
              event.sender_mode === "own_waba" && tenant.waba_status === "connected"
                ? tenant.business_name
                : event.host_name
                ? `${event.host_name} · ShowUp`
                : "ShowUp"
            }
            senderPhone={tenant.waba_status === "connected" ? tenant.display_phone_number : null}
            hostPhone={tenant.phone_e164}
            origin={origin}
            stage={previewStage}
            onStageChange={setPreviewStage}
            sendingTest={sendingTest}
            onSendTest={onSendTest}
            onToast={onToast}
          />
        </div>
      </div>
    </div>
  );
}

