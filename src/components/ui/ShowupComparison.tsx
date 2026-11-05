"use client";

import React, { useState } from "react";
import { Check, Mail, MessageSquare, TrendingUp, X } from "lucide-react";

export function ShowupComparison() {
  const [attendeeCount, setAttendeeCount] = useState<number>(100);

  const emailAttendees = Math.round(attendeeCount * 0.18);
  const whatsappAttendees = Math.round(attendeeCount * 0.54);
  const extraAttendees = whatsappAttendees - emailAttendees;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Interactive Attendees Simulator Slider */}
      <div className="neat-card p-6 sm:p-8 space-y-4 max-w-xl mx-auto text-center">
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Interactive Live Room Calculator
        </div>
        <div className="text-xl sm:text-2xl font-semibold text-white">
          If you have{" "}
          <span className="text-emerald-400 font-mono font-bold">
            {attendeeCount} registrants
          </span>
          :
        </div>

        <div className="py-2">
          <input
            type="range"
            min={30}
            max={500}
            step={10}
            value={attendeeCount}
            onChange={(e) => setAttendeeCount(Number(e.target.value))}
            className="w-full cursor-pointer"
          />
        </div>

        <div className="flex justify-between text-xs font-mono text-slate-400">
          <span>30 leads</span>
          <span>250 leads</span>
          <span>500 leads</span>
        </div>
      </div>

      {/* Side-by-side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Standard Email Reminders */}
        <div className="neat-card p-6 sm:p-8 space-y-6 text-left border-white/5 opacity-80 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">
                  Standard Email Reminders
                </h4>
                <div className="text-xs text-slate-400 font-mono">
                  Mailchimp / ConvertKit / Zoom Mail
                </div>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              ~18% Show-Up
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="text-xs text-slate-400 font-mono">People in your room:</div>
            <div className="text-3xl font-bold font-mono text-slate-300">
              ~{emailAttendees} attendees
            </div>
            <div className="text-xs text-red-400 font-mono pt-1">
              82 out of 100 people never open your email
            </div>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-400">
            <li className="flex items-start gap-2.5">
              <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>Buried under 200+ promo emails and Gmail &quot;Promotions&quot; tab</span>
            </li>
            <li className="flex items-start gap-2.5">
              <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>No push notification urgency on webinar start time</span>
            </li>
            <li className="flex items-start gap-2.5">
              <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>Safaricom / Airtel mobile users in Kenya rarely check email</span>
            </li>
          </ul>
        </div>

        {/* Card 2: ShowUp WhatsApp Engine */}
        <div className="neat-card p-6 sm:p-8 space-y-6 text-left border-emerald-500/30 bg-[#0e1713] relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 px-3 py-1 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase font-mono tracking-wider rounded-bl-xl">
            Recommended
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#00a884] flex items-center justify-center text-white shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-white">
                  ShowUp WhatsApp Engine
                </h4>
                <div className="text-xs text-emerald-400 font-mono">
                  Official Meta Cloud API · Kenya EAT
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              54% Show-Up
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#091510] border border-emerald-500/30 space-y-1">
            <div className="text-xs text-emerald-400 font-mono">People in your room:</div>
            <div className="text-3xl font-bold font-mono text-emerald-400 flex items-baseline gap-2">
              <span>~{whatsappAttendees} attendees</span>
              <span className="text-xs font-semibold text-emerald-300">
                (+{extraAttendees} extra!)
              </span>
            </div>
            <div className="text-xs text-slate-300 font-mono pt-1">
              98% open rate within 5 minutes on WhatsApp
            </div>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-200">
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Instant push notification buzzer directly on personal WhatsApp</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>1-tap Google Calendar lock link and direct Zoom join link</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Pay per webinar via M-Pesa only when you launch (KES 1,500)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
