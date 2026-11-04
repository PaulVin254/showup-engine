"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  DEFAULT_WEBINAR_TEMPLATES,
  renderTemplatePreview,
} from "@/lib/default-templates";
import {
  BrandRibbon,
  BrandWordmark,
  InlineAvatarToken,
  InlineChartToken,
} from "@/components/BrandMark";
import { HeroTestWidget } from "@/components/interactive/HeroTestWidget";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]/60";
const BTN_CHARCOAL =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-[#f1f5f9] font-medium transition active:scale-[0.99]";
const PILL_INPUT =
  "w-full px-5 py-3.5 rounded-full bg-[#25272c] border border-white/[0.08] text-white text-sm placeholder:text-[#8a909e] focus:outline-none focus:border-[#4589ff] transition";

export default function LandingPage() {
  const [mascotVariant, setMascotVariant] = useState<"simba" | "creator">("simba");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const setupHref = "/dashboard?setup=1";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-canvas text-slate-100">
      {/* Edge-to-edge borderless Muse header */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() =>
              setMascotVariant((v) => (v === "simba" ? "creator" : "simba"))
            }
            className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#17191e] border border-white/[0.06] text-[#9ca3af] hover:text-white transition"
            title="Switch Kenyan 3D Mascot Token"
          >
            <Sparkles className="w-3 h-3 text-[#fbbf24]" />
            Mascot: {mascotVariant === "simba" ? "Simba Cub" : "Maasai Creator"}
          </button>

          <Link
            href="/r/nairobi-real-estate-masterclass"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white transition"
          >
            Live registration page
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-full bg-[#1877f2] hover:bg-[#2e86f8] text-white font-medium text-sm px-5 py-2 transition active:scale-[0.99]"
          >
            Open dashboard
          </Link>
        </div>
      </header>

      {/* Muse Hero + Instant <60s Test Reminder Box */}
      <section className="pt-8 sm:pt-14 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Free-floating Kenyan Shield-Wave Ribbon Mark */}
          <div className="mb-6 flex justify-center">
            <BrandRibbon className="w-20 h-16 sm:w-24 sm:h-20" />
          </div>

          {/* 2-line medium-weight grotesque headline with Kenyan 3D Mascot & Chart tokens */}
          <h1 className="text-4xl sm:text-6xl md:text-[64px] font-medium tracking-[-0.035em] leading-[1.12] text-white">
            ShowUp
            <InlineAvatarToken variant={mascotVariant} />
            , your Facebook leads
            <br className="hidden sm:inline" />{" "}
            read WhatsApp, not email
            <InlineChartToken />
          </h1>

          {/* Concise 2-line subtitle */}
          <p className="mt-5 text-base sm:text-lg text-[#9ca3af] leading-relaxed max-w-2xl mx-auto font-normal">
            Get 2–3× more people into your live webinar with automatic WhatsApp
            reminders in East Africa Time. Set up in 3 minutes. Pay via M-Pesa
            only when you launch.
          </p>

          {/* 21st-Grade Atmospheric Hero Interactive Test Widget (With Live WhatsApp Phone Mockup) */}
          <HeroTestWidget onSuccessToast={showToast} />
        </div>
      </section>

      {/* Proof Bar */}
      <section className="py-10 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              15% → 54%
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Typical webinar show-up rate lift in Kenya
            </div>
          </div>
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              3 mins
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Instant setup using ShowUp&apos;s verified sender
            </div>
          </div>
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              KES 1,500
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Pay per webinar via M-Pesa • No monthly lock-in
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Sequence Preview */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Five timed touches that fill the room.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              Every registrant receives this automated sequence in East Africa
              Time (EAT).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DEFAULT_WEBINAR_TEMPLATES.map((tpl) => (
              <div
                key={tpl.name}
                className="bg-[#17191e] border border-white/[0.06] rounded-3xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-medium text-white">
                      {tpl.timingLabel}
                    </span>
                    <span className="text-[10px] font-mono text-[#7c828e]">
                      {tpl.category}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#25272c] text-xs text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                    {renderTemplatePreview(tpl.body_text, tpl.example_values)}
                  </div>
                </div>
                <div className="mt-4 text-[11px] font-mono text-[#7c828e] truncate">
                  {tpl.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lean Pay-Per-Webinar Pricing */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Pay per webinar. Zero monthly bloat.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              Build your event, share your registration page, and load your
              leads for free. Pay via M-Pesa only when you press launch.
            </p>
          </div>

          <div className="rounded-3xl p-7 sm:p-10 bg-[#17191e] border border-[#4589ff]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4589ff]/15 text-[#4589ff] text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                30% Show-Up Guarantee or M-Pesa Refund
              </div>
              <h3 className="text-2xl font-medium text-white tracking-[-0.02em]">
                Single Webinar Launch Pass
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#9ca3af]">
                {[
                  "Up to 200 registrants included (KES 3,000 for 500 leads)",
                  "Hosted registration page + CSV paste/upload + Meta Lead Ads",
                  "All 5 automated WhatsApp reminders in East Africa Time",
                  "Instant launch on ShowUp's verified sender (or connect your own WABA later)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#4589ff] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full sm:w-auto sm:text-right shrink-0 space-y-4 bg-[#25272c] p-6 rounded-3xl border border-white/[0.06]">
              <div>
                <div className="text-xs text-[#8a909e]">One-time launch pass</div>
                <div className="font-mono tracking-tight text-4xl font-medium text-white mt-1">
                  KES 1,500
                </div>
                <div className="text-[11px] text-[#8a909e] mt-0.5">
                  per webinar via M-Pesa STK
                </div>
              </div>
              <Link
                href={setupHref}
                className={`${BTN_PRIMARY} w-full px-7 py-3.5 text-sm`}
              >
                Create your webinar free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] text-[#8a909e] text-center">
                Free until you press launch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-5 py-3 rounded-full bg-[#1b2721] border border-emerald-500/30 text-emerald-300 shadow-2xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <footer className="py-12 border-t border-white/[0.06] text-center text-xs text-[#7c828e]">
        ShowUp · Built for Kenya &amp; Africa · Official Meta WhatsApp Cloud API
      </footer>

      {/* Cloudflare Turnstile Script */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        strategy="afterInteractive"
      />
    </div>
  );
}
