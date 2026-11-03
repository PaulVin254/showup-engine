"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { DEFAULT_WEBINAR_TEMPLATES, renderTemplatePreview } from "@/lib/default-templates";

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-lg">
                ShowUp<span className="text-emerald-400">Engine</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                Built for Kenya &amp; Africa
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/r/nairobi-real-estate-masterclass"
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-emerald-400 px-3 py-2 rounded-lg border border-slate-800 hover:border-slate-700 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Live Registration Funnel
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20"
            >
              Open SaaS Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              Official Meta WhatsApp Cloud API • Zero Phone Ban Risk
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Stop Losing <span className="text-red-400">80%</span> of Your Paid Facebook
              Ad Leads Before Your Webinar Starts.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
              Kenyan buyers don&apos;t check email spam folders or click bulk SMS links.{" "}
              <strong className="text-white">They live on WhatsApp.</strong> ShowUp Engine
              connects your Meta Lead Ads to a timed 5-Stage WhatsApp Countdown Sequence
              that lifts live room attendance from{" "}
              <span className="text-slate-400 line-through">20%</span> to{" "}
              <span className="text-emerald-400 font-bold">55%–60%+</span> without spending
              one extra shilling on ads.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-xl shadow-emerald-500/20"
              >
                Launch Free Pilot (First 100 Registrants Free)
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#calculator"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
              >
                <Calculator className="w-4 h-4 text-emerald-400" />
                Calculate Your Ad Waste
              </a>
            </div>

            <div className="pt-4 grid grid-cols-3 gap-4 max-w-lg mx-auto text-center">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">96%</div>
                <div className="text-[11px] text-slate-400">WhatsApp Open Rate in KE</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xl sm:text-2xl font-extrabold text-white">55–60%</div>
                <div className="text-[11px] text-slate-400">Proven Live Show-Up</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                  &lt; 5 Min
                </div>
                <div className="text-[11px] text-slate-400">Meta Embedded Signup</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Ad Waste Calculator */}
      <section id="calculator" className="py-16 border-b border-slate-900 bg-slate-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The Math Doesn&apos;t Lie
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1">
              Calculate Your &ldquo;Ad Waste Number&rdquo; Per Webinar
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Slide the numbers below to match your typical Kenyan masterclass or webinar
              campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Sliders */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300">Meta Ad Spend per Launch</span>
                  <span className="font-bold text-emerald-400">
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
                  className="w-full accent-emerald-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Cost per Registrant (Ksh)</span>
                    <span className="font-semibold text-white">Ksh {costPerLeadKes}</span>
                  </div>
                  <input
                    type="range"
                    min={80}
                    max={600}
                    step={20}
                    value={costPerLeadKes}
                    onChange={(e) => setCostPerLeadKes(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Current Email/SMS Show-Up %</span>
                    <span className="font-semibold text-red-400">{currentShowupPct}%</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={currentShowupPct}
                    onChange={(e) => setCurrentShowupPct(Number(e.target.value))}
                    className="w-full accent-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    ShowUp Engine Attendance %
                  </label>
                  <input
                    type="number"
                    value={targetShowupPct}
                    onChange={(e) => setTargetShowupPct(Number(e.target.value) || 50)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-emerald-400 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Your Course/Offer Price (Ksh)
                  </label>
                  <input
                    type="number"
                    value={offerPriceKes}
                    onChange={(e) => setOfferPriceKes(Number(e.target.value) || 10000)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Live Close Rate (%)
                  </label>
                  <input
                    type="number"
                    value={closeRatePct}
                    onChange={(e) => setCloseRatePct(Number(e.target.value) || 5)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Right Results Box */}
            <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30">
                  <div className="text-xs text-red-300">
                    Money Burned on No-Shows Right Now ({wastedLeads} no-shows)
                  </div>
                  <div className="text-2xl font-extrabold text-red-400 mt-0.5">
                    Ksh {adWasteKes.toLocaleString()} wasted / event
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[11px] text-slate-400">Attendance Before</div>
                    <div className="text-lg font-bold text-slate-300">
                      {currentAttendees} people{" "}
                      <span className="text-xs text-slate-500">({currentShowupPct}%)</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <div className="text-[11px] text-emerald-300">
                      With ShowUp Engine
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      {newAttendees} people{" "}
                      <span className="text-xs text-emerald-300">
                        (+{extraAttendees})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40">
                  <div className="text-xs text-emerald-200 font-medium">
                    Extra Revenue from +{extraAttendees} More People in the Room:
                  </div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    +Ksh {extraRevenueKes.toLocaleString()}
                  </div>
                  <div className="text-xs text-emerald-300 mt-1">
                    (~{extraSalesCount} extra sales @ Ksh {offerPriceKes.toLocaleString()} vs
                    Ksh 4,999/mo software cost)
                  </div>
                </div>
              </div>

              <Link
                href="/dashboard"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
              >
                Rescue Your Next Webinar Free
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The 5-Stage Sequence Preview */}
      <section className="py-16 border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              The 5-Touch Show-Up Mechanism
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1">
              Pre-Approved Meta Templates That Fire Like Clockwork
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              Every lead from your Facebook Ad or Registration Page receives these 5 timed
              messages in East Africa Time (EAT)—plus you can customize them in Template
              Studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DEFAULT_WEBINAR_TEMPLATES.map((tpl, index) => (
              <div
                key={tpl.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Stage {index + 1}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {tpl.category}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white mb-1">
                    {tpl.timingLabel}
                  </div>
                  <div className="mt-2 p-3 rounded-xl bg-[#0b141a] border border-emerald-950/60 text-[11px] text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                    {renderTemplatePreview(tpl.body_text, tpl.example_values)}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Template:</span>
                  <code className="text-emerald-400">{tpl.name}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Simple M-Pesa Pricing
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-white mt-1">
              Prove It on Your Next Event for Ksh 0
            </h2>
            <p className="text-sm text-slate-400 mt-2">
              If ShowUp Engine doesn&apos;t beat your last webinar&apos;s attendance rate,
              you don&apos;t pay a single shilling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1: Free Pilot */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Zero-Risk Proof of Concept
                </div>
                <h3 className="text-xl font-bold text-white">Free Pilot</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">Ksh 0</span>
                  <span className="text-xs text-slate-400">/ first event</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />1 Live
                    Webinar (up to 100 registrants)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Official Meta Embedded Signup
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    All 5 Automated WhatsApp Stages
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Hosted Registration Page + CSV Import
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="mt-6 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-white transition"
              >
                Start Free Pilot Now
              </Link>
            </div>

            {/* Tier 2: Starter */}
            <div className="bg-slate-900 border-2 border-emerald-500 rounded-2xl p-6 flex flex-col justify-between relative shadow-2xl shadow-emerald-500/10">
              <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-bold text-[11px]">
                MOST POPULAR
              </div>
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  For Weekly &amp; Monthly Hosts
                </div>
                <h3 className="text-xl font-bold text-white">Starter Tier</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">Ksh 4,999</span>
                  <span className="text-xs text-slate-400">/ month via M-Pesa</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Up to <strong>500 registrants / month</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Unlimited Webinars &amp; Masterclasses
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Meta Lead Ads + Hosted Page + CSV
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Template Studio (Default + Custom Templates)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Tracked Join Links &amp; Live ROI Reports
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="mt-6 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-slate-950 transition"
              >
                Activate Starter via M-Pesa
              </Link>
            </div>

            {/* Tier 3: Pro */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  For High-Volume Academies &amp; Agencies
                </div>
                <h3 className="text-xl font-bold text-white">Pro Scale</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">Ksh 9,999</span>
                  <span className="text-xs text-slate-400">/ month via M-Pesa</span>
                </div>
                <ul className="space-y-2.5 text-xs text-slate-300 pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Up to <strong>2,000 registrants / month</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Everything in Starter Tier
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Zoom &amp; Google Meet CSV Reconciler
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Priority Template Approval Assistance
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="mt-6 w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-bold text-white transition"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

