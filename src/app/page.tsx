"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  FileSpreadsheet,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Video,
} from "lucide-react";
import { BrandWordmark } from "@/components/BrandMark";
import { CreatorResults } from "@/components/ui/CreatorResults";
import { ObjectionFaq } from "@/components/ui/ObjectionFaq";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { StickyMobileCta } from "@/components/ui/StickyMobileCta";
import { faqItems, sampleResults } from "@/data/landing";

const setupHref = "/dashboard?setup=1";
const sampleHref = "/r/nairobi-real-estate-masterclass";

const touches = [
  { icon: Check, label: "Seat confirmed", when: "Instantly" },
  { icon: Calendar, label: "Calendar lock", when: "Right after" },
  { icon: Clock, label: "24h hook", when: "1 day before" },
  { icon: MessageCircle, label: "1h alert", when: "1 hour before" },
  { icon: Video, label: "Direct Zoom link", when: "5 min before" },
];

const steps = [
  {
    n: "01",
    icon: FileSpreadsheet,
    title: "Connect your leads",
    body: "Upload a CSV or plug in Meta Lead Ads. Your registrants land in one place, ready to message.",
  },
  {
    n: "02",
    icon: Smartphone,
    title: "Automated 5-touch WhatsApp in EAT",
    body: "Every registrant gets a timed countdown on the official Meta WhatsApp Cloud API, in East Africa Time.",
  },
  {
    n: "03",
    icon: TrendingUp,
    title: "Double your room on M-Pesa",
    body: "Watch 50–60% show up live. You pay KES 1,500 by M-Pesa only when you launch.",
  },
];

const resultsToShow = sampleResults.filter(
  (r) => r.niche === "real-estate" || r.niche === "consulting"
);

function PrimaryCta({ id, label = "Create your webinar free" }: { id?: string; label?: string }) {
  return (
    <Link
      id={id}
      href={setupHref}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold text-sm sm:text-base px-7 py-3.5 transition shadow-[0_4px_18px_rgba(24,119,242,0.4)]"
    >
      {label}
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 antialiased selection:bg-[#1877f2] selection:text-white overflow-x-hidden">
      {/* Header */}
      <header className="w-full px-4 sm:px-10 py-4 flex items-center justify-between border-b border-white/[0.08]">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>
        <div className="flex items-center gap-4">
          <Link
            href={sampleHref}
            className="hidden sm:inline text-xs text-slate-400 hover:text-white transition"
          >
            Sample page
          </Link>
          <Link
            href={setupHref}
            className="inline-flex items-center rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold text-xs px-4 py-2 transition"
          >
            Create free
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-14 sm:pt-24 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-[-0.03em] leading-[1.1] text-white">
            Your Facebook leads check WhatsApp,{" "}
            <span className="font-serif italic font-normal text-[#1877f2]">not email</span>
          </h1>
          <p className="mt-5 sm:mt-6 text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Automated WhatsApp reminders in East Africa Time take live show-up
            from ~18% to 50–60%. Set up in 3 minutes.
          </p>

          <div className="mt-9 flex flex-col items-center gap-3">
            <PrimaryCta id="hero-cta" />
            <p className="text-xs text-slate-500 font-mono">
              Free to build · Pay KES 1,500 by M-Pesa only when you launch
            </p>
            <Link
              href={sampleHref}
              className="text-sm text-slate-400 hover:text-white underline underline-offset-4 decoration-white/20 transition"
            >
              See sample registration page
            </Link>
          </div>

          <div className="mt-10 flex justify-center">
            <AvatarStack />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-20 border-t border-white/[0.08] px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Three steps to a fuller room
            </h2>
            <p className="text-sm text-slate-400">
              No new tools to learn. Your leads in, a packed webinar out.
            </p>
          </div>

          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-2xl border border-white/[0.08] bg-[#12141a] p-6 text-left flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#00a884]/25 bg-[#00a884]/10">
                    <s.icon className="w-5 h-5 text-[#00a884]" />
                  </span>
                  <span className="font-mono text-xs text-slate-500">{s.n}</span>
                </div>
                <h3 className="text-lg font-semibold text-white tracking-tight">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>

                {s.n === "02" && (
                  <ul className="mt-1 space-y-2 border-t border-white/[0.06] pt-4">
                    {touches.map((t, i) => (
                      <li key={t.label} className="flex items-center gap-2.5 text-xs">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00a884]/15 text-[#00a884] font-mono text-[10px]">
                          {i + 1}
                        </span>
                        <span className="text-slate-200">{t.label}</span>
                        <span className="ml-auto font-mono text-[11px] text-slate-500">
                          {t.when}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Social proof */}
      <section id="results" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-3 mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            From 18% to 54% in the room
          </h2>
          <p className="text-sm text-slate-400">
            Illustrative sample results from Nairobi real estate and consulting webinars.
          </p>
        </div>
        <div className="px-4 sm:px-6">
          <CreatorResults
            results={resultsToShow}
            showFilters={false}
            ctaHref="#pricing"
            ctaLabel="See the launch pass"
          />
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
              Pay per webinar. Zero monthly lock-in.
            </h2>
            <p className="text-sm text-slate-400">
              Build your room, test the sequence and connect your leads for free.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#12141a] p-6 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-4 max-w-md text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a884]/10 border border-[#00a884]/25 text-[#00a884] text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                30% Show-Up Guarantee or M-Pesa Refund
              </div>
              <h3 className="text-2xl font-semibold text-white tracking-tight">
                Single Webinar Launch Pass
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                {[
                  "All 5 automated WhatsApp reminders in East Africa Time",
                  "Hosted registration page + CSV upload + Meta Lead Ads",
                  "Up to 200 registrants included",
                  "No monthly lock-in. Pay by M-Pesa STK push",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#00a884] shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full sm:w-auto sm:text-right shrink-0 space-y-4 p-6 rounded-2xl bg-[#0d0f12] border border-white/[0.08]">
              <div>
                <div className="text-xs text-slate-400 font-mono">One-time launch pass</div>
                <div className="font-mono tracking-tight text-4xl font-bold text-white mt-1">
                  KES 1,500
                </div>
                <div className="text-[11px] text-[#00a884] font-mono mt-0.5">
                  per webinar via M-Pesa STK
                </div>
              </div>
              <Link
                href={setupHref}
                className="w-full py-3 px-6 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(24,119,242,0.35)]"
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

      {/* FAQ */}
      <section id="faq" className="py-20 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
            Questions Kenyan hosts ask first
          </h2>
        </div>
        <div className="px-4 sm:px-6">
          <ObjectionFaq items={faqItems} defaultOpenId="mpesa" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 border-t border-white/[0.08] px-4 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
          Fill your next webinar room
        </h2>
        <PrimaryCta />
      </section>

      {/* Footer */}
      <footer className="py-10 pb-24 sm:pb-10 border-t border-white/[0.08] text-center text-xs text-slate-500 font-mono space-y-2">
        <div>ShowUp Engine · Built for Kenya &amp; Africa · Official Meta WhatsApp Cloud API</div>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <Link href="/privacy" className="hover:text-white transition">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-white transition">
            Terms of Service
          </Link>
        </div>
      </footer>

      <StickyMobileCta href={setupHref} targetId="hero-cta" />
    </div>
  );
}
