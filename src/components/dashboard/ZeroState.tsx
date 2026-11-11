"use client";

import React from "react";
import { ArrowRight, Send } from "lucide-react";
import { Button } from "@/components/ui/kit";
import { PIPELINE_STAGES } from "@/lib/pipeline";

interface ZeroStateProps {
  onCreate: () => void;
  onSignIn: () => void;
  onTestMessage: () => void;
  sendingTest: boolean;
}

const TIMELINE = [
  "Instantly after signup",
  "2 minutes later",
  "24 hours before start",
  "1 hour before start",
  "5 minutes before start",
];

export function ZeroState({ onCreate, onSignIn, onTestMessage, sendingTest }: ZeroStateProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] lg:divide-x divide-white/[0.08] min-h-[calc(100vh-48px)] animate-rise">
      <div className="min-w-0 px-5 sm:px-12 py-12 sm:py-16 lg:py-24 flex flex-col justify-center max-w-2xl">
        <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-500">
          No webinars yet
        </span>
        <h1 className="mt-3 text-[28px] sm:text-[40px] leading-[1.08] font-semibold tracking-[-0.03em] text-white">
          Put your next webinar on autopilot.
        </h1>
        <p className="mt-4 text-[14px] sm:text-[15px] text-slate-400 leading-relaxed max-w-lg">
          Create the event, add your leads, and ShowUp sends five WhatsApp messages on East Africa
          Time. Pay KES 1,500 by M-Pesa when you launch.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button variant="brand" className="h-10 px-5 text-[14px]" onClick={onCreate} icon={undefined}>
            Create webinar · 60 sec
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button className="h-10" loading={sendingTest} onClick={onTestMessage} icon={<Send className="w-3.5 h-3.5" />}>
            Send me a test message
          </Button>
        </div>
        <button
          type="button"
          onClick={onSignIn}
          className="mt-6 self-start text-[12.5px] text-slate-500 hover:text-white transition"
        >
          Already have events? <span className="underline underline-offset-4">Sign in with WhatsApp</span>
        </button>
      </div>

      <div className="min-w-0 px-5 sm:px-10 py-10 sm:py-12 lg:py-24 flex flex-col justify-center border-t lg:border-t-0 border-white/[0.08] bg-white/[0.012]">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 mb-5">
          The sequence
        </div>
        <ol className="relative">
          <span aria-hidden className="absolute left-[11px] top-3 bottom-3 w-px bg-white/[0.08]" />
          {PIPELINE_STAGES.map((s, i) => (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
              <span className="relative z-10 w-6 h-6 rounded-full bg-[#0d0f12] border border-white/[0.12] flex items-center justify-center font-mono tabular-nums text-[11px] text-slate-300">
                {s.step}
              </span>
              <div>
                <div className="text-[13.5px] font-medium text-white leading-6">{s.label}</div>
                <div className="text-[12px] text-slate-500">{TIMELINE[i]}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

