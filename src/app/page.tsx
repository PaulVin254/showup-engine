"use client";

import React, { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
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
import { soundFx } from "@/lib/interactive-delight";

export default function LandingPage() {
  const [mascotVariant, setMascotVariant] = useState<"simba" | "creator">("simba");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const setupHref = "/dashboard?setup=1";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#101114] text-slate-100">
      {/* Edge-to-edge tactile clay header */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between border-b border-[#1c202a]">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              setMascotVariant((v) => (v === "simba" ? "creator" : "simba"));
            }}
            className="hidden md:inline-flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-full clay-btn-charcoal text-slate-300 hover:text-white transition"
            title="Switch Kenyan 3D Mascot Token"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Mascot: {mascotVariant === "simba" ? "Simba Cub" : "Maasai Creator"}
          </button>

          <Link
            href="/r/nairobi-real-estate-masterclass"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition"
          >
            Live registration page
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard"
            onClick={() => soundFx.playClick()}
            className="clay-btn-emerald inline-flex items-center justify-center rounded-full text-white font-semibold text-xs sm:text-sm px-5 py-2.5 transition"
          >
            Open dashboard
          </Link>
        </div>
      </header>

      {/* Hero + Chunky 3D Molded Hardware Console */}
      <section className="pt-8 sm:pt-14 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Kenyan Shield-Wave Ribbon Mark */}
          <div className="mb-6 flex justify-center">
            <BrandRibbon className="w-20 h-16 sm:w-24 sm:h-20" />
          </div>

          {/* 2-line headline with Kenyan 3D Mascot & Chart tokens */}
          <h1 className="text-4xl sm:text-6xl md:text-[64px] font-medium tracking-[-0.035em] leading-[1.12] text-white">
            ShowUp
            <InlineAvatarToken variant={mascotVariant} />
            , your Facebook leads
            <br className="hidden sm:inline" />{" "}
            read WhatsApp, not email
            <InlineChartToken />
          </h1>

          {/* Concise 2-line subtitle */}
          <p className="mt-5 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto font-normal">
            Get 2–3× more people into your live webinar with automatic WhatsApp
            reminders in East Africa Time. Set up in 3 minutes. Pay via M-Pesa
            only when you launch.
          </p>

          {/* Chunky Claymorphic Molded Hardware Console (Zero Glassmorphism) */}
          <HeroTestWidget onSuccessToast={showToast} />
        </div>
      </section>

      {/* Proof Bar (Chunky Clay Tiles) */}
      <section className="py-12 border-y border-[#1c202a]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="clay-card p-6 space-y-1">
            <div className="font-mono tracking-tight text-3xl sm:text-4xl font-bold text-emerald-400">
              15% → 54%
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Typical webinar show-up rate jump in Kenya
            </div>
          </div>

          <div className="clay-card p-6 space-y-1">
            <div className="font-mono tracking-tight text-3xl sm:text-4xl font-bold text-white">
              3 mins
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Instant setup using ShowUp&apos;s verified sender
            </div>
          </div>

          <div className="clay-card p-6 space-y-1">
            <div className="font-mono tracking-tight text-3xl sm:text-4xl font-bold text-amber-400">
              KES 1,500
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Pay per webinar via M-Pesa • No monthly lock-in
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Sequence Preview in Tactile Clay */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white">
              Five timed touches that fill the room.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Every registrant receives this automated sequence in East Africa
              Time (EAT).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DEFAULT_WEBINAR_TEMPLATES.map((tpl) => (
              <div
                key={tpl.name}
                className="clay-card clay-card-hover p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-white">
                      {tpl.timingLabel}
                    </span>
                    <span className="clay-badge text-[10px] font-mono px-2 py-0.5 rounded-full text-slate-400">
                      {tpl.category}
                    </span>
                  </div>
                  <div className="clay-bubble-wa p-3.5 text-xs text-[#e2e8f0] whitespace-pre-wrap leading-relaxed shadow-sm">
                    {renderTemplatePreview(tpl.body_text, tpl.example_values)}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {tpl.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lean Pay-Per-Webinar Pricing (Molded Clay Deck) */}
      <section className="py-20 border-t border-[#1c202a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-2">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white">
              Pay per webinar. Zero monthly bloat.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Build your event, share your registration page, and load your
              leads for free. Pay via M-Pesa only when you press launch.
            </p>
          </div>

          <div className="clay-deck p-7 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-4 max-w-lg">
              <div className="clay-badge inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                30% Show-Up Guarantee or M-Pesa Refund
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                Single Webinar Launch Pass
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                {[
                  "Up to 200 registrants included (KES 3,000 for 500 leads)",
                  "Hosted registration page + CSV paste/upload + Meta Lead Ads",
                  "All 5 automated WhatsApp reminders in East Africa Time",
                  "Instant launch on ShowUp's verified sender (or connect your own WABA later)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full sm:w-auto sm:text-right shrink-0 space-y-4 clay-card p-6 rounded-3xl">
              <div>
                <div className="text-xs text-slate-400 font-medium">
                  One-time launch pass
                </div>
                <div className="font-mono tracking-tight text-4xl font-bold text-white mt-1">
                  KES 1,500
                </div>
                <div className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  per webinar via M-Pesa STK
                </div>
              </div>
              <Link
                href={setupHref}
                onClick={() => soundFx.playClick()}
                className="clay-btn-emerald w-full py-3.5 px-6 rounded-full text-sm font-bold text-white flex items-center justify-center gap-2 cursor-pointer"
              >
                Create your webinar free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] text-slate-400 text-center">
                Free until you press launch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-5 py-3.5 rounded-full clay-card text-emerald-300 text-xs font-semibold flex items-center gap-2.5 border-2 border-emerald-500/50 shadow-2xl">
          <span className="clay-led-green" />
          <span>{toastMsg}</span>
        </div>
      )}

      <footer className="py-12 border-t border-[#1c202a] text-center text-xs text-slate-500 font-medium">
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
