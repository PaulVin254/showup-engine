"use client";

import React, { useState } from "react";
import { Check, Mail, MessageSquare, X } from "lucide-react";

export function ShowupComparison() {
  const [attendeeCount, setAttendeeCount] = useState<number>(100);

  const emailAttendees = Math.round(attendeeCount * 0.18);
  const whatsappAttendees = Math.round(attendeeCount * 0.54);
  const extraAttendees = whatsappAttendees - emailAttendees;

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">
      {/* Interactive Attendees Simulator Slider */}
      <div className="bg-[#f4f4f4] border border-neutral-200/80 rounded-2xl p-6 sm:p-8 flex flex-col gap-4 max-w-xl w-full mx-auto text-center">
        <div className="text-xs font-mono text-neutral-500">
          Interactive Live Room Calculator
        </div>
        <div className="text-xl sm:text-2xl font-semibold text-[#111111]">
          If you have{" "}
          <span className="text-[#00a884] font-mono font-bold">
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
            aria-label="Number of webinar registrants"
            className="w-full cursor-pointer accent-[#111111]"
          />
        </div>

        <div className="flex justify-between text-xs font-mono text-neutral-500">
          <span>30 leads</span>
          <span>250 leads</span>
          <span>500 leads</span>
        </div>
      </div>

      {/* Side-by-side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Standard Email Reminders */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 flex flex-col gap-6 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#f4f4f4] border border-neutral-200/80 flex items-center justify-center text-neutral-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-[#111111]">
                  Standard Email Reminders
                </h4>
                <div className="text-xs text-neutral-500 font-mono">
                  Mailchimp / ConvertKit / Zoom Mail
                </div>
              </div>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200/80 shrink-0">
              ~18% Show-Up
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#f8f8f8] border border-neutral-200/70 flex flex-col gap-1">
            <div className="text-xs text-neutral-500 font-mono">
              People in your room:
            </div>
            <div className="text-3xl font-bold font-mono text-neutral-700">
              ~{emailAttendees} attendees
            </div>
            <div className="text-xs text-red-600 font-mono pt-1">
              82 out of 100 people never open your email
            </div>
          </div>

          <ul className="flex flex-col gap-3 text-xs sm:text-sm text-neutral-600">
            <li className="flex items-start gap-2.5">
              <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                Buried under 200+ promo emails and Gmail &quot;Promotions&quot;
                tab
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>No push notification urgency on webinar start time</span>
            </li>
            <li className="flex items-start gap-2.5">
              <X className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>
                Safaricom / Airtel mobile users in Kenya rarely check email
              </span>
            </li>
          </ul>
        </div>

        {/* Card 2: ShowUp WhatsApp Engine */}
        <div className="bg-white border-2 border-[#111111] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 text-left relative overflow-hidden shadow-[0_18px_45px_-20px_rgba(0,0,0,0.14)]">
          <div className="absolute top-0 right-0 px-3.5 py-1 bg-[#111111] text-white font-medium text-[10px] font-mono rounded-bl-xl">
            Recommended
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00a884] flex items-center justify-center text-white shadow-xs">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-[#111111]">
                  ShowUp WhatsApp Engine
                </h4>
                <div className="text-xs text-[#00a884] font-mono font-medium">
                  Official Meta Cloud API · Kenya EAT
                </div>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
              54% Show-Up
            </span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col gap-1">
            <div className="text-xs text-emerald-800 font-mono">
              People in your room:
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-700 flex flex-wrap items-baseline gap-2">
              <span>~{whatsappAttendees} attendees</span>
              <span className="text-xs font-semibold text-emerald-800">
                (+{extraAttendees} extra!)
              </span>
            </div>
            <div className="text-xs text-emerald-900/80 font-mono pt-1">
              98% open rate within 5 minutes on WhatsApp
            </div>
          </div>

          <ul className="flex flex-col gap-3 text-xs sm:text-sm text-[#111111]">
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
              <span>
                Instant push notification buzzer directly on personal WhatsApp
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
              <span>
                1-tap Google Calendar lock link and direct Zoom join link
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
              <span>
                Pay per webinar via M-Pesa only when you launch (KES 1,500)
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
