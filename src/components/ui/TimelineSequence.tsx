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
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react";
import { DEFAULT_WEBINAR_TEMPLATES, renderTemplatePreview } from "@/lib/default-templates";
import { soundFx } from "@/lib/interactive-delight";

const STAGES = [
  {
    step: 1,
    timeLabel: "Instant (T+0s)",
    badge: "Welcome & Proof",
    title: "Instant WhatsApp Confirmation",
    desc: "Immediately upon registration, the lead receives a personal WhatsApp text confirming their seat, adding social commitment.",
    previewText:
      "Hi Brian 👋 You're confirmed for *Nairobi Real Estate Masterclass*!\n\n📅 Saturday, 14 Nov at 7:00 PM (EAT)\n\nSave this number — I'll drop your direct join link right here on WhatsApp before we open the room.",
  },
  {
    step: 2,
    timeLabel: "T + 2 mins",
    badge: "Calendar Lock",
    title: "1-Click Google Calendar Lock",
    desc: "A quick follow-up with a direct Google Calendar lock link to prevent double-booking on webinar day.",
    previewText:
      "Quick tip Brian 📅 Lock *Nairobi Real Estate Masterclass* into your Google Calendar so you don't double-book:\n\n👉 https://showup.sitesync.tech/cal\n\nStarts Saturday at 7:00 PM (EAT). See you inside!",
  },
  {
    step: 3,
    timeLabel: "T - 24 Hours",
    badge: "Value Teaser",
    title: "Anticipation & Agenda Teaser",
    desc: "24 hours before doors open, we send the core framework hook so registrants remember why they signed up.",
    previewText:
      "Hi Brian, tomorrow at 7:00 PM (EAT) we go live for *Nairobi Real Estate Masterclass* 🎯\n\nWe are breaking down the exact off-plan funding formulas for 2026. Have your notebook ready!",
  },
  {
    step: 4,
    timeLabel: "T - 60 Minutes",
    badge: "Urgency Alarm",
    title: "60-Minute Countdown Alert",
    desc: "The critical reminder that prompts attendees to get to their laptop or quiet room before start time.",
    previewText:
      "🚨 *Starting in 60 minutes!* (7:00 PM EAT)\n\nHi Brian, grab your seat for *Nairobi Real Estate Masterclass*. Direct join link arrives in 55 mins right here on WhatsApp.",
  },
  {
    step: 5,
    timeLabel: "T - 5 Minutes",
    badge: "Live Join Link",
    title: "Doors Open & Direct Join Link",
    desc: "The high-conversion trigger that bypasses buried email inboxes and sends attendees straight into your Zoom/YouTube room.",
    previewText:
      "🔴 *WE ARE LIVE NOW!*\n\nHi Brian, doors are open for *Nairobi Real Estate Masterclass*. Tap below to join directly:\n\n👉 https://zoom.us/j/89271892\n\nSee you in the room!",
  },
];

export function TimelineSequence() {
  const [activeStep, setActiveStep] = useState<number>(1);

  const handleStepClick = (step: number) => {
    soundFx.playClick();
    setActiveStep(step);
  };

  const currentStage = STAGES.find((s) => s.step === activeStep) || STAGES[0];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Step Selector Pills (Mobile-first responsive horizontal rail) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {STAGES.map((s) => {
          const isSelected = activeStep === s.step;
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => handleStepClick(s.step)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-[#1877f2]/10 border-[#1877f2]/50 text-white shadow-lg shadow-[#1877f2]/15"
                  : "bg-[#14161f] border-white/5 text-slate-400 hover:text-white hover:border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-mono text-[11px] font-semibold ${isSelected ? "text-[#1877f2]" : "text-slate-400"}`}>
                  0{s.step}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 font-mono text-slate-400">
                  {s.timeLabel.split(" ")[0]}
                </span>
              </div>
              <div className="text-xs font-semibold mt-1.5 truncate text-white">
                {s.badge}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Stage Detail & Realistic WhatsApp Preview Card */}
      <div className="neat-card p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        {/* Left: Stage Information */}
        <div className="md:col-span-6 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1877f2]/10 border border-[#1877f2]/20 text-[#1877f2] text-xs font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>{currentStage.timeLabel}</span>
            <span>·</span>
            <span className="text-slate-300">{currentStage.badge}</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
            {currentStage.title}
          </h3>

          <p className="text-sm text-slate-400 leading-relaxed">
            {currentStage.desc}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-white">
              <Check className="w-4 h-4 text-emerald-400" />
              Automated in East Africa Time (EAT)
            </span>
            <span className="flex items-center gap-1.5 text-white">
              <Check className="w-4 h-4 text-emerald-400" />
              Meta Cloud API Verified
            </span>
          </div>
        </div>

        {/* Right: Realistic WhatsApp Bubble Preview */}
        <div className="md:col-span-6">
          <div className="rounded-2xl bg-[#0b141a] border border-white/10 p-4 space-y-3 shadow-xl">
            {/* WhatsApp Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-xs">
                  S
                </div>
                <div>
                  <div className="flex items-center gap-1 font-semibold text-white text-xs">
                    <span>ShowUp Verified Sender</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884]" />
                  </div>
                  <div className="text-[10px] text-[#8696a0] font-mono">
                    Official WhatsApp Cloud API
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2c34] text-emerald-400">
                Step {currentStage.step} of 5
              </div>
            </div>

            {/* Bubble */}
            <div className="rounded-2xl rounded-tl-sm bg-[#1f2c34] p-4 space-y-2.5 text-[#e9edef] text-xs leading-relaxed text-left">
              <p className="whitespace-pre-wrap">{currentStage.previewText}</p>

              <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] font-mono text-[#8696a0]">
                <span>19:00</span>
                <span className="text-[#53bdeb] font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

