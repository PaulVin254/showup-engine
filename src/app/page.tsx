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
import { BrandRibbon, BrandWordmark } from "@/components/BrandMark";
import { HeroTestWidget } from "@/components/interactive/HeroTestWidget";
import { TimelineSequence } from "@/components/ui/TimelineSequence";
import { ShowupComparison } from "@/components/ui/ShowupComparison";
import { soundFx } from "@/lib/interactive-delight";

export default function LandingPage() {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const setupHref = "/dashboard?setup=1";

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 antialiased selection:bg-emerald-500 selection:text-slate-950 overflow-x-hidden">
      {/* =================================================================== */}
      {/* MINIMALIST HEADER                                                  */}
      {/* =================================================================== */}
      <header className="w-full px-4 sm:px-10 py-4.5 flex items-center justify-between border-b border-white/[0.08]">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/r/nairobi-real-estate-masterclass"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            Live registration sample
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/dashboard"
            onClick={() => soundFx.playClick()}
            className="inline-flex items-center justify-center rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-semibold text-xs px-4 py-2 transition"
          >
            Open dashboard
          </Link>
        </div>
      </header>

      {/* =================================================================== */}
      {/* HERO SECTION (NeatMail Minimalist Craft)                           */}
      {/* =================================================================== */}
      <section className="pt-10 sm:pt-16 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Top Announcement Badge with strictly sized Simba Avatar */}
          <div className="mb-6 flex justify-center">
            <Link
              href="#timeline"
              className="group inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] px-3.5 py-1.5 text-xs text-slate-300 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="w-5 h-5 rounded-full overflow-hidden bg-amber-100/20 shrink-0 inline-block border border-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/tokens/avatar-token.png"
                  alt="Simba Mascot"
                  className="w-full h-full object-cover"
                />
              </span>
              <span className="font-medium text-white truncate">
                Built for Kenyan Creators
              </span>
              <span className="hidden sm:inline text-slate-500">·</span>
              <span className="hidden sm:inline text-slate-400 font-mono text-[11px]">
                5-Stage WhatsApp EAT Sequences
              </span>
              <span className="text-emerald-400 transition-transform group-hover:translate-x-0.5">
                →
              </span>
            </Link>
          </div>

          {/* Clean Geometric Headline with Editorial Italic Emphasis */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.12] text-white max-w-3xl mx-auto">
            ShowUp, your Facebook leads
            <br className="hidden sm:inline" />{" "}
            read WhatsApp,{" "}
            <span className="font-serif italic font-normal text-emerald-400">
              not email.
            </span>
          </h1>

          {/* Concise Subtitle */}
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto font-normal">
            Get 2–3× more people into your live webinar with automated WhatsApp
            reminders in East Africa Time. Set up in 3 minutes. Pay via M-Pesa
            only when you launch.
          </p>

          {/* Minimalist Hairline Hero Test Widget */}
          <HeroTestWidget onSuccessToast={showToast} />
        </div>
      </section>

      {/* =================================================================== */}
      {/* 21ST DEV COMPONENT 2: EMAIL VS WHATSAPP COMPARISON                 */}
      {/* =================================================================== */}
      <section className="py-20 border-y border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            // The Show-Up Lift Gap
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Why Kenyan attendees miss emails &amp; join on WhatsApp
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Email reminders get lost in spam filters and promotions tabs. WhatsApp
            buzzes directly on their phone 5 minutes before doors open.
          </p>
        </div>

        <div className="px-4 sm:px-6">
          <ShowupComparison />
        </div>
      </section>

      {/* =================================================================== */}
      {/* 21ST DEV COMPONENT 1: 5-STAGE SEQUENCE TIMELINE                    */}
      {/* =================================================================== */}
      <section id="timeline" className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
            // Automated Sequence Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Five timed touches that fill the room
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Every registrant receives this automated 5-stage countdown sequence in
            East Africa Time (EAT). Tap any stage to preview the exact message.
          </p>
        </div>

        <div className="px-4 sm:px-6">
          <TimelineSequence />
        </div>
      </section>

      {/* =================================================================== */}
      {/* MINIMALIST PRICING (KES 1,500 Launch Pass)                         */}
      {/* =================================================================== */}
      <section className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Pay per webinar. Zero monthly lock-in.
            </h2>
            <p className="text-sm text-slate-400">
              Build your room, test the sequence, and connect your leads for free.
              Pay via M-Pesa only when you launch.
            </p>
          </div>

          <div className="neat-card p-6 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-4 max-w-md text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                30% Show-Up Guarantee or M-Pesa Refund
              </div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">
                Single Webinar Launch Pass
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                {[
                  "Up to 200 registrants included (KES 3,000 for 500 leads)",
                  "Hosted registration page + CSV upload + Meta Lead Ads",
                  "All 5 automated WhatsApp reminders in East Africa Time",
                  "Instant launch on ShowUp's verified sender",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full sm:w-auto sm:text-right shrink-0 space-y-4 p-6 rounded-2xl bg-[#171a22] border border-white/5">
              <div>
                <div className="text-xs text-slate-400 font-mono">One-time launch pass</div>
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
                className="w-full py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                Create your webinar free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] text-slate-400 text-center font-mono">
                Free until you press launch
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-4 py-2.5 rounded-full bg-[#171a22] text-emerald-300 text-xs font-medium flex items-center gap-2 border border-emerald-500/40 shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="py-10 border-t border-white/[0.08] text-center text-xs text-slate-500 font-mono">
        ShowUp Engine · Built for Kenya &amp; Africa · Official Meta WhatsApp Cloud API
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
