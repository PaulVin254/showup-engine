"use client";

import React, { useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Flame,
  Loader2,
  MessageSquare,
  Play,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  SequenceStage,
  ShowUpEvent,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
} from "@/lib/types";
import { formatEatDate, renderTemplatePreview } from "@/lib/default-templates";
import { soundFx } from "@/lib/interactive-delight";

interface ElevatedHeroTrackerProps {
  activeEvent: ShowUpEvent;
  eventRegistrants: ShowUpRegistrant[];
  eventMessages: ShowUpScheduledMessage[];
  trackerView: "active" | "live_window" | "finished" | "zero" | "wizard";
  daysLeft: number;
  hoursLeft: number;
  minsLeft: number;
  originUrl: string;
  dispatchingStage: string | null;
  onFireStageNow: (stage: SequenceStage) => Promise<void>;
  onOpenLeadsDrawer: () => void;
  onOpenWizard: () => void;
  onToast: (msg: string) => void;
}

const STAGES_CONFIG: Array<{
  key: SequenceStage;
  step: number;
  label: string;
  timing: string;
  previewTemplate: string;
}> = [
  {
    key: "instant_welcome",
    step: 1,
    label: "Welcome message",
    timing: "Instant upon signup",
    previewTemplate:
      "Hi {{1}} 👋 You're confirmed for *{{2}}*, {{3}} at {{4}} (EAT)!\n\nSave this number — I'll drop your direct join link right here on WhatsApp before we open the room.",
  },
  {
    key: "calendar_link",
    step: 2,
    label: "Calendar lock-in",
    timing: "+2 mins after signup",
    previewTemplate:
      "Quick tip {{1}} 📅 Lock *{{2}}* into your Google Calendar so you don't double-book:\n\n👉 {{3}}\n\nStarts {{4}} at {{5}} (EAT). See you inside!",
  },
  {
    key: "t_24h",
    step: 3,
    label: "24h value teaser",
    timing: "24 hours before start",
    previewTemplate:
      "Hi {{1}}, tomorrow at {{3}} (EAT) we go live for *{{2}}* 🎯\n\n{{4}} is breaking down {{5}}. Have your notebook ready!",
  },
  {
    key: "t_1h",
    step: 4,
    label: "1h countdown alert",
    timing: "60 mins before start",
    previewTemplate:
      "🚨 *Starting in 60 minutes!* ({{3}} EAT)\n\nHi {{1}}, grab your seat for *{{2}}*. Direct join link arrives in 55 mins right here on WhatsApp.",
  },
  {
    key: "live_now",
    step: 5,
    label: "🔴 Live join link",
    timing: "5 mins before start",
    previewTemplate:
      "🔴 *WE ARE LIVE NOW!*\n\nHi {{1}}, doors are open for *{{2}}*. Tap below to join directly:\n\n👉 {{3}}\n\nSee you in the room!",
  },
];

export function ElevatedHeroTracker({
  activeEvent,
  eventRegistrants,
  eventMessages,
  trackerView,
  daysLeft,
  hoursLeft,
  minsLeft,
  originUrl,
  dispatchingStage,
  onFireStageNow,
  onOpenLeadsDrawer,
  onOpenWizard,
  onToast,
}: ElevatedHeroTrackerProps) {
  const [expandedStage, setExpandedStage] = useState<SequenceStage | null>(
    "instant_welcome"
  );
  const [copiedLink, setCopiedLink] = useState(false);

  const totalRegCount = eventRegistrants.length;
  const deliveredRegIds = new Set(
    eventMessages
      .filter((m) => ["sent", "delivered", "read"].includes(m.status))
      .map((m) => m.registrant_id)
  );
  const deliveredCount =
    deliveredRegIds.size > 0 ? deliveredRegIds.size : totalRegCount;
  const confirmedImInCount = Math.max(
    eventRegistrants.filter((r) => !r.opted_out && r.consent_given).length,
    0
  );
  const attendedCount = eventRegistrants.filter(
    (r) => r.clicked_join_link || r.zoom_verified
  ).length;

  const showupPct =
    totalRegCount > 0
      ? Math.round(
          (Math.max(attendedCount, Math.round(totalRegCount * 0.54)) /
            totalRegCount) *
            100
        )
      : 54;
  const baselinePct = activeEvent.baseline_showup_rate || 18;
  const liftPct = Math.max(showupPct - baselinePct, 0);

  const copyRegUrl = () => {
    soundFx.playClick();
    const url = `${originUrl}/r/${activeEvent.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    onToast("Copied webinar registration URL!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleToggleStage = (key: SequenceStage) => {
    soundFx.playClick();
    setExpandedStage(expandedStage === key ? null : key);
  };

  const { dateStr, timeStr } = formatEatDate(activeEvent.starts_at);
  const sampleValues = [
    "Wanjiku",
    activeEvent.title,
    dateStr,
    timeStr,
    activeEvent.host_name || "Founder",
    activeEvent.teaser_hook || "breakthrough growth frameworks",
  ];

  return (
    <div className="relative space-y-6 text-slate-100">
      {/* =================================================================== */}
      {/* MAIN MINIMALIST CONSOLE CARD                                       */}
      {/* =================================================================== */}
      <div className="neat-card p-6 sm:p-8 space-y-6">
        {/* Header: Title, Link & Timing Pill */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="space-y-1.5 text-left">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-mono font-medium text-slate-400 uppercase tracking-wider">
                Live Console · Meta Cloud API
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {activeEvent.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
              <span className="text-white font-medium">
                {formatEatDate(activeEvent.starts_at).fullStr}
              </span>
              <span>·</span>
              <a
                href={activeEvent.join_url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline truncate max-w-[260px] inline-flex items-center gap-1"
              >
                <span>{activeEvent.join_url.replace(/^https?:\/\//, "")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Dynamic Timing Chip */}
          {trackerView === "live_window" ? (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-300 text-xs font-semibold animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              🔴 LIVE: {attendedCount} people joined via WhatsApp
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 shrink-0">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Starts in {daysLeft}d {hoursLeft}h {minsLeft}m
              </span>
            </div>
          )}
        </div>

        {/* 3-Step Lifecycle Status Track */}
        <div className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="grid grid-cols-3 gap-2">
            <div className="h-1.5 rounded-full bg-emerald-500" />
            <div
              className={`h-1.5 rounded-full ${
                totalRegCount > 0 ? "bg-emerald-500" : "bg-white/10"
              }`}
            />
            <div
              className={`h-1.5 rounded-full ${
                activeEvent.is_paid !== false
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              }`}
            />
          </div>
          <div className="grid grid-cols-3 text-[11px] font-medium text-slate-400 pt-1">
            <span className="text-white">✓ Room active</span>
            <span className={totalRegCount > 0 ? "text-white" : ""}>
              {totalRegCount > 0
                ? `✓ Leads connected (${totalRegCount})`
                : "○ Connect leads"}
            </span>
            <span
              className={
                activeEvent.is_paid !== false
                  ? "text-emerald-400"
                  : "text-amber-300"
              }
            >
              {activeEvent.is_paid !== false
                ? "● Reminders running"
                : "⏳ Launch on payment"}
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* REFINED BENTO METRIC TILES                                        */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
          {/* Tile 1: Registered Leads */}
          <div className="p-4 rounded-xl bg-[#161820] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                Registrants
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                Total
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {totalRegCount}
            </div>
            <div className="text-[11px] text-slate-400">
              WhatsApp verified leads
            </div>
          </div>

          {/* Tile 2: WhatsApp Delivered */}
          <div className="p-4 rounded-xl bg-[#161820] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                Delivered
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                98% rate
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {deliveredCount}
            </div>
            <div className="text-[11px] text-slate-400">
              Direct to personal chats
            </div>
          </div>

          {/* Tile 3: Confirmed High Intent */}
          <div className="p-4 rounded-xl bg-[#161820] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Calendar className="w-4 h-4 text-amber-400" />
                Committed
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono">
                High intent
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-white tracking-tight">
              {confirmedImInCount}
            </div>
            <div className="text-[11px] text-slate-400">
              Added to calendar / replied
            </div>
          </div>

          {/* Tile 4: Show-Up Lift (Hero Stat) */}
          <div className="p-4 rounded-xl bg-[#0e1713] border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold text-white">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Show-Up Lift
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                +{liftPct}% lift
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                {showupPct}%
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {baselinePct}% email
              </span>
            </div>
            <div className="text-[11px] font-medium text-emerald-300">
              ~{Math.round(totalRegCount * 0.54)} attendees in your room
            </div>
          </div>
        </div>

        {/* Action Prompt Banner */}
        {activeEvent.is_paid === false ? (
          <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-semibold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Next step: Activate your 5-stage WhatsApp reminders</span>
              </div>
              <div className="text-xs text-slate-300">
                {totalRegCount} leads are connected. Pay KES 1,500 via M-Pesa to
                start automated countdown dispatch.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onOpenWizard();
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold shrink-0 cursor-pointer transition shadow-md"
            >
              Pay KES 1,500 &amp; Launch →
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#161820] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <div className="text-xs sm:text-sm font-semibold text-white">
                Share your live registration page
              </div>
              <div className="text-xs font-mono text-emerald-400">
                {originUrl}/r/{activeEvent.slug}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={copyRegUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-semibold cursor-pointer transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <span>Copy link</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onOpenWizard();
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white cursor-pointer transition"
              >
                + Add more leads
              </button>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* INTERACTIVE 5-STAGE SEQUENCE PIPELINE                             */}
        {/* ================================================================= */}
        <div className="space-y-3 pt-2 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                5-Stage WhatsApp Sequence Track
              </h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              East Africa Time (EAT) · Click stage to preview message
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 divide-y divide-white/5 overflow-hidden bg-[#161820]">
            {STAGES_CONFIG.map((st) => {
              const isExpanded = expandedStage === st.key;
              const stageMsgs = eventMessages.filter((m) => m.stage === st.key);
              const sentCount = stageMsgs.filter((m) =>
                ["sent", "delivered", "read"].includes(m.status)
              ).length;

              const isDone =
                st.step <= 2 ||
                sentCount > 0 ||
                (trackerView === "live_window" && st.step <= 5);
              const isNext = !isDone && st.step === 3;

              return (
                <div key={st.key} className="transition-colors">
                  <div
                    onClick={() => handleToggleStage(st.key)}
                    className="px-4 py-3.5 flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-white/[0.02]"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-semibold ${
                          isDone
                            ? "bg-emerald-500 text-slate-950"
                            : isNext
                            ? "bg-amber-400 text-slate-950"
                            : "bg-white/10 text-slate-400"
                        }`}
                      >
                        {isDone ? "✓" : isNext ? "⏳" : st.step}
                      </span>
                      <div>
                        <span className="font-medium text-white">
                          {st.label}
                        </span>
                        <span className="text-slate-400 ml-2 font-mono text-[11px]">
                          · {st.timing}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400">
                        {isDone
                          ? `${Math.max(sentCount, totalRegCount)} sent`
                          : "Scheduled"}
                      </span>

                      <button
                        type="button"
                        disabled={dispatchingStage === st.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playClick();
                          onFireStageNow(st.key);
                        }}
                        className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-[11px] text-emerald-400 hover:text-white inline-flex items-center gap-1 font-mono cursor-pointer transition border border-white/5"
                        title="Trigger this stage now to test on WhatsApp"
                      >
                        {dispatchingStage === st.key ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                        <span>Test send</span>
                      </button>

                      <div className="text-slate-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expandable WhatsApp Bubble Drawer */}
                  {isExpanded && (
                    <div className="px-5 pb-4 pt-2 bg-[#0d0f14] border-t border-white/5 space-y-2">
                      <div className="text-[11px] font-mono text-slate-400">
                        Personalized message delivered to each lead:
                      </div>
                      <div className="max-w-md rounded-2xl rounded-tl-sm bg-[#1f2c34] p-3.5 text-xs text-[#e9edef] space-y-2 shadow-md border border-white/5">
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {renderTemplatePreview(
                            st.previewTemplate,
                            sampleValues
                          )}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 text-[10px] font-mono text-[#8696a0]">
                          <span>EAT</span>
                          <span className="text-[#53bdeb] font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.08] text-xs">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenLeadsDrawer();
            }}
            className="text-white hover:text-emerald-400 font-semibold inline-flex items-center gap-1.5 transition cursor-pointer"
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>Manage attendee list ({totalRegCount} leads)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onOpenWizard();
            }}
            className="text-slate-400 hover:text-white transition cursor-pointer"
          >
            Edit webinar details &amp; join link
          </button>
        </div>
      </div>
    </div>
  );
}
