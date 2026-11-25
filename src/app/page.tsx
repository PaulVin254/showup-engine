"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Calendar,
  Check,
  Menu,
  MessageCircle,
  ShieldCheck,
  Video,
  X,
} from "lucide-react";
import { MobbinShowcaseFrame } from "@/components/ui/MobbinShowcaseFrame";
import { TimelineSequence } from "@/components/ui/TimelineSequence";
import { ShowupComparison } from "@/components/ui/ShowupComparison";
import { CreatorResults } from "@/components/ui/CreatorResults";
import { ObjectionFaq } from "@/components/ui/ObjectionFaq";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { StickyMobileCta } from "@/components/ui/StickyMobileCta";
import { faqItems, sampleResults } from "@/data/landing";

const setupHref = "/dashboard?setup=1";
const sampleHref = "/r/nairobi-real-estate-masterclass";

function InlineWhatsAppSquircle() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center align-middle mx-1 sm:mx-2 -mt-1.5 w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-[12px] sm:rounded-[16px] bg-gradient-to-br from-[#25D366] via-[#00a884] to-[#075E54] text-white shadow-[0_10px_24px_-6px_rgba(0,168,132,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] rotate-[-3deg] select-none"
    >
      <MessageCircle className="w-5 h-5 sm:w-7 sm:h-7 fill-white/15 stroke-[2.2]" />
    </span>
  );
}

function InlineCalendarSquircle() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center align-middle mx-1 sm:mx-2 -mt-1.5 w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-[12px] sm:rounded-[16px] bg-gradient-to-br from-[#a3e635] via-[#84cc16] to-[#4d7c0f] text-[#111111] shadow-[0_10px_24px_-6px_rgba(132,204,22,0.55),inset_0_1px_1px_rgba(255,255,255,0.65)] rotate-[3deg] select-none"
    >
      <Calendar className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.3]" />
    </span>
  );
}

function InlineSphereSquircle() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center align-middle mx-1 sm:mx-2 -mt-1.5 w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-[12px] sm:rounded-[16px] bg-gradient-to-br from-[#27272a] via-[#111111] to-[#000000] text-white shadow-[0_12px_26px_-6px_rgba(0,0,0,0.45),inset_0_1px_2px_rgba(255,255,255,0.35)] rotate-[-2deg] select-none"
    >
      <Video className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.1]" />
    </span>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#111111] antialiased selection:bg-[#111111] selection:text-white overflow-x-hidden">
      {/* Minimal Mobbin-Style Header */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              aria-label="ShowUp Home"
              className="flex items-center gap-2.5 shrink-0"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111111] text-white font-bold text-sm tracking-tight">
                S
              </span>
              <span className="text-[16px] font-semibold tracking-tight text-[#111111]">
                ShowUp
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-[13px] font-medium text-neutral-600">
              <a
                href="#sequence"
                className="hover:text-[#111111] transition-colors"
              >
                Sequence
              </a>
              <a
                href="#calculator"
                className="hover:text-[#111111] transition-colors"
              >
                Calculator
              </a>
              <a
                href="#customers"
                className="hover:text-[#111111] transition-colors"
              >
                Customers
              </a>
              <a
                href="#pricing"
                className="hover:text-[#111111] transition-colors"
              >
                Pricing
              </a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3 text-[13px] font-medium">
            <Link
              href={sampleHref}
              className="text-neutral-600 hover:text-[#111111] px-3 py-1.5 transition-colors"
            >
              Sample room
            </Link>
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="text-neutral-700 hover:text-[#111111] px-3 py-1.5 transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center rounded-full bg-[#111111] hover:bg-neutral-800 text-white px-4 py-2 text-[13px] font-medium transition"
              >
                Start for free
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="inline-flex items-center rounded-full bg-[#111111] hover:bg-neutral-800 text-white px-4 py-2 text-[13px] font-medium transition"
              >
                Dashboard
              </Link>
              <UserButton />
            </Show>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 rounded-full border border-neutral-200 text-[#111111]"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white px-4 py-4 flex flex-col gap-3 text-sm font-medium text-[#111111]">
            <a href="#sequence" onClick={() => setMobileMenuOpen(false)}>
              Sequence
            </a>
            <a href="#calculator" onClick={() => setMobileMenuOpen(false)}>
              Calculator
            </a>
            <a href="#customers" onClick={() => setMobileMenuOpen(false)}>
              Customers
            </a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </a>
            <Link href={sampleHref} onClick={() => setMobileMenuOpen(false)}>
              Sample room
            </Link>
            <Show when="signed-out">
              <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-[#111111] text-white py-2.5 text-sm font-medium"
              >
                Start for free
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 inline-flex items-center justify-center rounded-full bg-[#111111] text-white py-2.5 text-sm font-medium"
              >
                Dashboard
              </Link>
            </Show>
          </div>
        )}
      </header>

      {/* Mobbin-Style Centered Hero */}
      <section className="pt-14 sm:pt-20 pb-10 px-4 sm:px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-[68px] font-semibold tracking-[-0.04em] leading-[1.06] text-[#111111]">
            Where <InlineWhatsAppSquircle /> hosts
            <br className="hidden sm:block" /> and creators{" "}
            <InlineCalendarSquircle /> fill
            <br className="hidden sm:block" /> webinars <InlineSphereSquircle />{" "}
            that convert.
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-neutral-500 max-w-xl mx-auto leading-relaxed font-normal">
            The WhatsApp attendance engine for webinars and online classes.
            Automated 5-touch EAT reminders that lift live show-up from 18% to
            54%.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              id="hero-cta"
              href={setupHref}
              className="inline-flex items-center justify-center rounded-full bg-[#111111] hover:bg-neutral-800 text-white font-medium text-sm px-6 py-3 transition active:scale-[0.98]"
            >
              Start for free
            </Link>
            <a
              href="#pricing"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#f3f3f3] hover:bg-neutral-200/80 text-[#111111] font-medium text-sm px-6 py-3 transition active:scale-[0.98]"
            >
              <span>See launch pass</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Centerpiece Recessed Mobbin Showcase Frame */}
      <section className="pb-14">
        <MobbinShowcaseFrame />

        {/* Platform Ecosystem Strip + Creator Avatar Proof */}
        <div className="max-w-5xl mx-auto px-4 mt-12 text-center flex flex-col items-center gap-6">
          <p className="text-xs text-neutral-400 font-medium">
            Built for webinar hosts running on
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-neutral-400 font-semibold text-sm sm:text-base tracking-tight">
            <span>Meta Cloud API</span>
            <span>Zoom</span>
            <span>Google Meet</span>
            <span>YouTube Live</span>
            <span>Safaricom M-Pesa</span>
          </div>
          <AvatarStack className="mt-2" />
        </div>
      </section>

      {/* Interactive 5-Touch Sequence Section */}
      <section
        id="sequence"
        className="py-16 sm:py-24 border-t border-neutral-100 px-4 sm:px-6 bg-white"
      >
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-3 mb-12">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
            Five timed touches in East Africa Time
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Every registrant is queued automatically via official Meta WhatsApp
            Cloud API templates, from instant booking to the 5-minute join ping.
          </p>
        </div>
        <TimelineSequence />
      </section>

      {/* Interactive Live Room Calculator */}
      <section
        id="calculator"
        className="py-16 sm:py-24 border-t border-neutral-100 px-4 sm:px-6 bg-[#fafafa]"
      >
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-3 mb-12">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
            See how many extra seats you fill
          </h2>
          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Drag the slider to compare standard email reminders (~18% live
            attendance) against ShowUp&apos;s 5-touch WhatsApp engine (54%).
          </p>
        </div>
        <ShowupComparison />
      </section>

      {/* Creator Results Showcase */}
      <section
        id="customers"
        className="py-16 sm:py-24 border-t border-neutral-100 px-4 sm:px-6 bg-white"
      >
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-3 mb-10">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
            From 18% to 54% in the room
          </h2>
          <p className="text-sm sm:text-base text-neutral-500">
            Illustrative sample results across Nairobi real estate, finance,
            e-commerce, and consulting webinars.
          </p>
        </div>
        <CreatorResults
          results={sampleResults}
          showFilters={true}
          ctaHref={setupHref}
          ctaLabel="Start building for free"
        />
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="py-16 sm:py-24 border-t border-neutral-100 px-4 sm:px-6 bg-[#fafafa]"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 flex flex-col gap-3">
            <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
              Pay per webinar. Zero monthly lock-in.
            </h2>
            <p className="text-sm sm:text-base text-neutral-500">
              Build your registration page, test the WhatsApp sequence, and
              import leads free. Pay only when you launch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Free Sandbox Card */}
            <div className="md:col-span-5 rounded-[24px] border border-neutral-200 bg-white p-7 flex flex-col justify-between gap-6 text-left">
              <div>
                <div className="text-xs font-mono text-neutral-500">
                  Builder Sandbox
                </div>
                <div className="text-3xl font-bold font-mono text-[#111111] mt-2">
                  KES 0
                </div>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
                  Set up your event page, customize templates, and test live
                  delivery to your own WhatsApp before paying a shilling.
                </p>
                <ul className="mt-6 flex flex-col gap-2.5 text-sm text-neutral-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>Hosted /r/ registration page</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>CSV &amp; Meta Lead Ads preview</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>Live WhatsApp test ping</span>
                  </li>
                </ul>
              </div>

              <Link
                href={setupHref}
                className="w-full py-3 px-5 rounded-full bg-[#f3f3f3] hover:bg-neutral-200 text-[#111111] text-sm font-medium text-center transition"
              >
                Try builder free
              </Link>
            </div>

            {/* Single Webinar Launch Pass Card */}
            <div className="md:col-span-7 rounded-[24px] border-2 border-[#111111] bg-white p-7 sm:p-8 flex flex-col justify-between gap-6 text-left shadow-[0_24px_60px_-25px_rgba(0,0,0,0.14)]">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  30% Show-Up Guarantee or M-Pesa Refund
                </div>

                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-2xl font-semibold text-[#111111] tracking-tight">
                    Single Webinar Launch Pass
                  </h3>
                  <div className="font-mono text-3xl font-bold text-[#111111]">
                    KES 1,500
                  </div>
                </div>

                <ul className="mt-6 flex flex-col gap-3 text-sm text-neutral-700">
                  {[
                    "All 5 automated WhatsApp reminders in East Africa Time",
                    "Hosted registration page + CSV upload + Meta Lead Ads sync",
                    "Up to 200 registrants included with tracked /j/ shortlinks",
                    "No monthly subscription. Pay by M-Pesa STK push only when launching",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#00a884] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-neutral-100">
                <span className="text-xs font-mono text-neutral-500">
                  One-time M-Pesa STK pass · Free until launch
                </span>
                <Link
                  href={setupHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] hover:bg-neutral-800 text-white font-medium text-sm px-6 py-3 transition shrink-0"
                >
                  Create your webinar free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        id="faq"
        className="py-16 sm:py-24 border-t border-neutral-100 px-4 sm:px-6 bg-white"
      >
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-[#111111]">
            Questions Kenyan hosts ask first
          </h2>
        </div>
        <ObjectionFaq items={faqItems} defaultOpenId="mpesa" />
      </section>

      {/* Final Minimal CTA */}
      <section className="py-16 sm:py-20 border-t border-neutral-100 px-4 text-center bg-[#fafafa]">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-5">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-[#111111]">
            Fill your next webinar room
          </h2>
          <p className="text-sm text-neutral-500">
            Stop losing 82% of your Meta ad leads to unread Gmail tabs.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={setupHref}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] hover:bg-neutral-800 text-white font-medium text-sm px-6 py-3 transition"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href={sampleHref}
              className="inline-flex items-center justify-center rounded-full bg-white border border-neutral-200 hover:bg-neutral-100 text-[#111111] font-medium text-sm px-6 py-3 transition"
            >
              View sample page
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="py-10 pb-24 sm:pb-10 border-t border-neutral-200/80 bg-white text-center text-xs text-neutral-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>
            ShowUp Engine · Built for Kenya &amp; Africa · Official Meta
            WhatsApp Cloud API
          </span>
          <div className="flex items-center justify-center gap-4 text-[11px] text-neutral-500">
            <Link
              href="/privacy"
              className="hover:text-[#111111] transition-colors"
            >
              Privacy Policy
            </Link>
            <span>·</span>
            <Link
              href="/terms"
              className="hover:text-[#111111] transition-colors"
            >
              Terms of Service
            </Link>
            <span>·</span>
            <Link
              href="/data-deletion"
              className="hover:text-[#111111] transition-colors"
            >
              Data Deletion
            </Link>
          </div>
        </div>
      </footer>

      <StickyMobileCta href={setupHref} targetId="hero-cta" label="Start for free" />
    </div>
  );
}
