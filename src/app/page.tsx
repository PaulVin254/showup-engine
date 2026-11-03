"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { DEFAULT_WEBINAR_TEMPLATES, renderTemplatePreview } from "@/lib/default-templates";
import {
  BrandRibbon,
  BrandWordmark,
  InlineAvatarToken,
  InlineChartToken,
} from "@/components/BrandMark";

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]/60";
const BTN_CHARCOAL =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-[#f1f5f9] font-medium transition active:scale-[0.99]";
const PILL_INPUT =
  "w-full px-5 py-3 rounded-full bg-[#25272c] border border-white/[0.06] text-white font-mono tracking-tight text-sm focus:outline-none focus:border-[#4589ff] transition";

export default function LandingPage() {
  // Interactive Kenyan Ad Waste Calculator state
  const [adSpendKes, setAdSpendKes] = useState(60000);
  const [costPerLeadKes, setCostPerLeadKes] = useState(200);
  const [currentShowupPct, setCurrentShowupPct] = useState(20);
  const [targetShowupPct, setTargetShowupPct] = useState(55);
  const [offerPriceKes, setOfferPriceKes] = useState(25000);
  const [closeRatePct, setCloseRatePct] = useState(5);

  const totalRegistrants = Math.max(1, Math.round(adSpendKes / costPerLeadKes));
  const currentAttendees = Math.round((currentShowupPct / 100) * totalRegistrants);
  const newAttendees = Math.round((targetShowupPct / 100) * totalRegistrants);
  const extraAttendees = Math.max(0, newAttendees - currentAttendees);

  const wastedLeads = Math.max(0, totalRegistrants - currentAttendees);
  const adWasteKes = Math.round(
    adSpendKes * (1 - currentShowupPct / Math.max(targetShowupPct, 1))
  );
  const extraSalesCount = ((extraAttendees * closeRatePct) / 100).toFixed(1);
  const extraRevenueKes = Math.round(
    extraAttendees * (closeRatePct / 100) * offerPriceKes
  );

  return (
    <div className="min-h-screen bg-canvas text-slate-100">
      {/* Edge-to-edge borderless Muse header */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/r/nairobi-real-estate-masterclass"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white transition"
          >
            Live funnel demo
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

      {/* Muse Hero */}
      <section className="pt-10 sm:pt-16 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Free-floating calligraphic blue ribbon mark */}
          <div className="mb-7 flex justify-center">
            <BrandRibbon className="w-20 h-16 sm:w-24 sm:h-20" />
          </div>

          {/* 2-line medium-weight grotesque headline with inline 3D tokens */}
          <h1 className="text-4xl sm:text-6xl md:text-[66px] font-medium tracking-[-0.035em] leading-[1.12] text-white">
            ShowUp
            <InlineAvatarToken />
            , AI that gets your
            <br className="hidden sm:inline" />{" "}
            webinar leads into the room
            <InlineChartToken />
          </h1>

          {/* Concise 2-line subtitle */}
          <p className="mt-6 text-base sm:text-lg text-[#9ca3af] leading-relaxed max-w-xl mx-auto font-normal">
            Automated 5-stage WhatsApp reminders on the official Meta Cloud API.
            Lift live attendance from 20% to 60% without extra ad spend.
          </p>

          {/* Two tactile Muse pills */}
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className={`${BTN_PRIMARY} w-full sm:w-auto min-w-[210px] px-8 py-3.5 text-[15px]`}
            >
              Launch Free Pilot
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#calculator"
              className={`${BTN_CHARCOAL} w-full sm:w-auto min-w-[210px] px-8 py-3.5 text-[15px]`}
            >
              Calculate Ad Waste
            </a>
          </div>
        </div>
      </section>

      {/* Proof Bar (outside the hero so the hero stays airy) */}
      <section className="py-10 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              96%
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              WhatsApp open rate in Kenya
            </div>
          </div>
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              55-60%
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Verified live webinar attendance
            </div>
          </div>
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              &lt;5 min
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Official Meta Embedded Signup
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Ad Waste Calculator */}
      <section id="calculator" className="py-24 scroll-mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Your ad waste number, per webinar.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              Move the sliders to match your typical Kenyan masterclass campaign.
            </p>
          </div>

          <div className="bg-[#17191e] border border-white/[0.06] rounded-3xl p-6 sm:p-10 space-y-8">
            {/* Output figures */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-center sm:text-left">
              <div>
                <div className="text-xs text-[#8a909e]">
                  Wasted ad spend ({wastedLeads} no-shows)
                </div>
                <div className="font-mono tracking-tight text-4xl sm:text-5xl font-medium text-white mt-1.5">
                  Ksh {adWasteKes.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-[#8a909e]">Extra revenue recovered</div>
                <div className="font-mono tracking-tight text-4xl sm:text-5xl font-medium text-[#4589ff] mt-1.5">
                  +Ksh {extraRevenueKes.toLocaleString()}
                </div>
                <div className="text-xs text-[#8a909e] mt-1.5">
                  ~{extraSalesCount} extra sales at Ksh {offerPriceKes.toLocaleString()} ({currentAttendees} to {newAttendees} live attendees)
                </div>
              </div>
            </div>

            <div className="h-px bg-white/[0.06]" />

            {/* Sliders & Pill Inputs */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2.5">
                  <span className="text-[#9ca3af]">Meta ad spend per launch</span>
                  <span className="font-mono tracking-tight text-white">
                    Ksh {adSpendKes.toLocaleString()}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={300000}
                  step={5000}
                  value={adSpendKes}
                  onChange={(e) => setAdSpendKes(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between text-xs mb-2.5">
                    <span className="text-[#9ca3af]">Cost per registrant</span>
                    <span className="font-mono tracking-tight text-white">
                      Ksh {costPerLeadKes}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={600}
                    step={20}
                    value={costPerLeadKes}
                    onChange={(e) => setCostPerLeadKes(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2.5">
                    <span className="text-[#9ca3af]">Current email/SMS show-up</span>
                    <span className="font-mono tracking-tight text-white">
                      {currentShowupPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={currentShowupPct}
                    onChange={(e) => setCurrentShowupPct(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs text-[#8a909e] mb-2 ml-3">
                    ShowUp attendance %
                  </label>
                  <input
                    type="number"
                    value={targetShowupPct}
                    onChange={(e) => setTargetShowupPct(Number(e.target.value) || 50)}
                    className={PILL_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8a909e] mb-2 ml-3">
                    Offer price (Ksh)
                  </label>
                  <input
                    type="number"
                    value={offerPriceKes}
                    onChange={(e) => setOfferPriceKes(Number(e.target.value) || 10000)}
                    className={PILL_INPUT}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8a909e] mb-2 ml-3">
                    Live close rate (%)
                  </label>
                  <input
                    type="number"
                    value={closeRatePct}
                    onChange={(e) => setCloseRatePct(Number(e.target.value) || 5)}
                    className={PILL_INPUT}
                  />
                </div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className={`${BTN_PRIMARY} w-full py-4 text-[15px]`}
            >
              Rescue your next webinar free
            </Link>
          </div>
        </div>
      </section>

      {/* 5-Stage Sequence */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Five timed touches that fill the room.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              Every registrant receives this automated sequence in East Africa Time (EAT).
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

      {/* Pricing */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Prove it on your next event for Ksh 0.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              If ShowUp doesn&apos;t beat your last webinar&apos;s attendance rate, you pay nothing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                eyebrow: "First webinar free",
                name: "Free Pilot",
                price: "Ksh 0",
                unit: "/ first event",
                cta: "Start Free Pilot",
                featured: false,
                features: [
                  "1 live webinar (up to 100 registrants)",
                  "Official Meta Embedded Signup",
                  "All 5 automated WhatsApp reminders",
                  "Hosted registration page + CSV import",
                ],
              },
              {
                eyebrow: "Weekly & monthly hosts",
                name: "Starter",
                price: "Ksh 4,999",
                unit: "/ month via M-Pesa",
                cta: "Activate Starter",
                featured: true,
                features: [
                  "Up to 500 registrants / month",
                  "Unlimited webinars & masterclasses",
                  "Meta Lead Ads + hosted page + CSV",
                  "Template Studio (default + custom)",
                  "Tracked join links & live ROI reports",
                ],
              },
              {
                eyebrow: "Academies & agencies",
                name: "Pro Scale",
                price: "Ksh 9,999",
                unit: "/ month via M-Pesa",
                cta: "Upgrade to Pro",
                featured: false,
                features: [
                  "Up to 2,000 registrants / month",
                  "Everything in Starter",
                  "Zoom & Google Meet CSV reconciler",
                  "Priority template approval support",
                ],
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`rounded-3xl p-7 flex flex-col justify-between border ${
                  tier.featured
                    ? "bg-[#1d2026] border-[#4589ff]/40"
                    : "bg-[#17191e] border-white/[0.06]"
                }`}
              >
                <div className="space-y-4">
                  <div className="text-xs text-[#8a909e]">{tier.eyebrow}</div>
                  <h3 className="text-xl font-medium text-white tracking-[-0.02em]">
                    {tier.name}
                  </h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono tracking-tight text-3xl font-medium text-white">
                      {tier.price}
                    </span>
                    <span className="text-xs text-[#8a909e]">{tier.unit}</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-[#9ca3af] pt-2">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#4589ff] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href="/dashboard"
                  className={`mt-8 w-full py-3.5 text-sm ${
                    tier.featured ? BTN_PRIMARY : BTN_CHARCOAL
                  }`}
                >
                  {tier.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/[0.06] text-center text-xs text-[#7c828e]">
        ShowUp · Built for Kenya &amp; Africa
      </footer>
    </div>
  );
}
