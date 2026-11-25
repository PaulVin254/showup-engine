"use client";

import React, { useState } from "react";
import {
  Bell,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Search,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Video,
} from "lucide-react";

type ShowcaseTab =
  | "5-Touch Sequence"
  | "Before & After Lift"
  | "M-Pesa STK Flow"
  | "Sample Registration";

interface DirectoryCol {
  heading: string;
  targetTab: ShowcaseTab;
  items: string[];
}

const DIRECTORY_COLUMNS: DirectoryCol[] = [
  {
    heading: "Lead Sources",
    targetTab: "Sample Registration",
    items: [
      "Meta Lead Ads",
      "CSV Bulk Upload",
      "Hosted Event Page",
      "Universal Webhook",
      "+254 Phone Normalizer",
    ],
  },
  {
    heading: "5-Touch Sequence",
    targetTab: "5-Touch Sequence",
    items: [
      "T+0s Seat Confirmed",
      "T+2m Calendar Lock",
      "T-24h Value Teaser",
      "T-1h Urgency Alert",
      "T-5m Live Room Link",
    ],
  },
  {
    heading: "Room Links & Lift",
    targetTab: "Before & After Lift",
    items: [
      "Zoom Webinar",
      "Google Meet",
      "YouTube Live",
      "Tracked /j/ Shortlinks",
      "CSV Attendance Match",
    ],
  },
  {
    heading: "Billing & ROI",
    targetTab: "M-Pesa STK Flow",
    items: [
      "M-Pesa STK Push",
      "30% Show-Up Guarantee",
      "Live Room Calculator",
      "Post-Event ROI Sheet",
      "Official Meta Cloud API",
    ],
  },
];

const TABS: ShowcaseTab[] = [
  "5-Touch Sequence",
  "Before & After Lift",
  "M-Pesa STK Flow",
  "Sample Registration",
];

function PhoneChrome({
  time = "19:00",
  badge,
  children,
}: {
  time?: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[270px] bg-white rounded-t-[30px] border-x-[6px] border-t-[6px] border-[#111111] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] overflow-hidden flex flex-col">
      {/* Dynamic Island + Status Bar */}
      <div className="px-4 pt-2.5 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-[#111111] bg-white">
        <span>{time}</span>
        <div className="w-16 h-3.5 bg-[#111111] rounded-full" aria-hidden="true" />
        <div className="flex items-center gap-1">
          <span className="inline-block w-3 h-2 rounded-[2px] border border-[#111111] relative">
            <span className="absolute inset-y-[1px] left-[1px] right-[2px] bg-[#111111]" />
          </span>
        </div>
      </div>

      {badge && (
        <div className="px-3.5 pb-2 pt-0.5 flex items-center justify-between border-b border-neutral-100 bg-white">
          <span className="text-[10px] font-mono font-medium text-neutral-500">
            {badge}
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
      )}

      <div className="flex-1 min-h-[268px] flex flex-col">{children}</div>
    </div>
  );
}

export function MobbinShowcaseFrame() {
  const [platform, setPlatform] = useState<"WhatsApp" | "Web">("WhatsApp");
  const [deviceOs, setDeviceOs] = useState<"iOS" | "Android">("iOS");
  const [activeTab, setActiveTab] = useState<ShowcaseTab>("5-Touch Sequence");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const handleSelectDirectoryItem = (item: string, targetTab: ShowcaseTab) => {
    setSelectedItem((prev) => (prev === item ? null : item));
    setActiveTab(targetTab);
  };

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4">
      {/* Outer Recessed Frame (Mobbin style) */}
      <div className="rounded-[28px] bg-[#f3f3f3] p-2 sm:p-3.5 border border-neutral-200/90 shadow-[0_30px_70px_-28px_rgba(0,0,0,0.09)]">
        {/* Inner White Window */}
        <div className="bg-white rounded-[20px] border border-neutral-200/80 overflow-hidden text-[#111111]">
          {/* Top App Bar */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-neutral-100 flex flex-wrap items-center justify-between gap-3">
            {/* Left Mark & Channels */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111111] text-white font-bold text-xs tracking-tighter">
                  S
                </span>
                <span className="font-semibold text-sm tracking-tight text-[#111111] hidden sm:inline">
                  ShowUp
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs font-medium">
                {(["WhatsApp", "Web"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                      platform === p
                        ? "bg-neutral-100 text-[#111111]"
                        : "text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Search Pill */}
            <div className="flex-1 min-w-[200px] max-w-md mx-auto">
              <label className="relative flex items-center w-full">
                <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search on ShowUp (e.g. M-Pesa, Zoom, T-24h)..."
                  aria-label="Search ShowUp features and sequences"
                  className="w-full rounded-full bg-[#f4f4f4] hover:bg-[#ededed] focus:bg-white border border-transparent focus:border-neutral-300 pl-9 pr-4 py-2 text-xs text-[#111111] placeholder:text-neutral-400 outline-none transition"
                />
              </label>
            </div>

            {/* Right Utility Actions */}
            <div className="hidden md:flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-mono font-medium">
                EAT · +254 Ready
              </span>
              <span className="p-1.5 rounded-full text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 transition">
                <Bookmark className="w-4 h-4" />
              </span>
              <span className="p-1.5 rounded-full text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 transition">
                <Bell className="w-4 h-4" />
              </span>
              <span className="h-7 w-7 rounded-full overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/tokens/avatar-token.png"
                  alt="Host profile"
                  className="h-full w-full object-cover"
                />
              </span>
            </div>
          </div>

          {/* 4-Column Interactive Index Directory (Mobbin signature) */}
          <div className="px-5 sm:px-8 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6 border-b border-neutral-100 text-left">
            {DIRECTORY_COLUMNS.map((col) => (
              <div key={col.heading}>
                <div className="text-[11px] font-medium text-neutral-400 mb-2.5">
                  {col.heading}
                </div>
                <ul className="flex flex-col gap-1.5">
                  {col.items.map((item) => {
                    const isMatch =
                      !normalizedQuery ||
                      item.toLowerCase().includes(normalizedQuery);
                    const isSelected = selectedItem === item;
                    return (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectDirectoryItem(item, col.targetTab)
                          }
                          className={`text-xs sm:text-[13px] font-medium text-left transition cursor-pointer ${
                            isSelected
                              ? "text-[#111111] underline underline-offset-4 decoration-2"
                              : isMatch
                              ? "text-neutral-800 hover:text-[#111111]"
                              : "text-neutral-300"
                          }`}
                        >
                          {item}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Filter & View Switcher Bar */}
          <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* iOS / Android Segmented Pill */}
              <div className="inline-flex items-center p-0.5 rounded-full bg-[#f4f4f4] border border-neutral-200/70 text-[11px] font-medium">
                {(["iOS", "Android"] as const).map((os) => (
                  <button
                    key={os}
                    type="button"
                    onClick={() => setDeviceOs(os)}
                    className={`px-2.5 py-1 rounded-full transition cursor-pointer ${
                      deviceOs === os
                        ? "bg-white text-[#111111] shadow-xs"
                        : "text-neutral-500 hover:text-[#111111]"
                    }`}
                  >
                    {os}
                  </button>
                ))}
              </div>

              {/* View Tabs */}
              <div className="flex flex-wrap items-center gap-1 sm:gap-3 text-xs font-medium">
                {TABS.map((tab) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1.5 rounded-full transition cursor-pointer ${
                        active
                          ? "text-[#111111] bg-neutral-100 font-semibold"
                          : "text-neutral-400 hover:text-neutral-700"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-500">
              {selectedItem && (
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-[#111111] text-[11px] font-medium transition cursor-pointer"
                >
                  {selectedItem} ×
                </button>
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 px-2.5 py-1 rounded-full border border-neutral-200">
                <Filter className="w-3 h-3" />
                <span>{deviceOs} Preview</span>
              </span>
            </div>
          </div>

          {/* 3-Column Device Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-6 pb-6 pt-1">
            {activeTab === "5-Touch Sequence" && (
              <>
                {/* Card 1: Instant Welcome & Calendar Lock */}
                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="14:02" badge="T+0s · Seat Confirmed">
                    <div className="bg-[#efeae2] flex-1 p-3 flex flex-col gap-2.5 text-left">
                      <div className="flex items-center gap-2 bg-white rounded-xl px-2.5 py-2 border border-neutral-200/70">
                        <span className="h-6 w-6 rounded-full bg-[#00a884] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                          S
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#111111]">
                            <span>ShowUp Verified</span>
                            <CheckCircle2 className="w-3 h-3 text-[#00a884]" />
                          </div>
                          <div className="text-[9px] text-neutral-500 font-mono">
                            Official WhatsApp API
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl rounded-tl-sm p-3 shadow-xs border border-neutral-200/60 text-[11px] leading-relaxed text-[#111111]">
                        <p>
                          Hi Brian, your seat is confirmed for{" "}
                          <strong>Nairobi Real Estate Masterclass</strong>.
                        </p>
                        <p className="mt-1.5 text-neutral-600">
                          Sat, 14 Nov at 7:00 PM EAT. Your direct join link drops
                          right here 5 mins before doors open.
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-[#1877f2] font-medium">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Add to Google Calendar
                          </span>
                          <span>→</span>
                        </div>
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                {/* Card 2: T-24h Value Hook & T-60m Countdown */}
                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="18:00" badge="T-60m · Urgency Alert">
                    <div className="bg-gradient-to-b from-neutral-100 to-neutral-200/70 flex-1 p-3 flex flex-col justify-center gap-2.5 text-left">
                      <div className="bg-white/95 backdrop-blur rounded-2xl p-3 shadow-sm border border-neutral-200/80">
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                          <span className="font-semibold text-[#00a884] flex items-center gap-1">
                            <Clock className="w-3 h-3" /> WhatsApp
                          </span>
                          <span>now</span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#111111]">
                          Starting in 60 minutes (7:00 PM EAT)
                        </div>
                        <p className="text-[10.5px] text-neutral-600 mt-1 leading-relaxed">
                          Grab your notebook, Brian. Tonight we cover off-plan
                          funding formulas for 2026. Join link arrives at 6:55 PM.
                        </p>
                      </div>

                      <div className="bg-white rounded-2xl p-3 border border-neutral-200/70">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-neutral-500 font-mono">
                            98% WhatsApp open rate
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                            Read in 4m
                          </span>
                        </div>
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                {/* Card 3: T-5m Live Room Link */}
                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="18:55" badge="T-5m · Doors Open">
                    <div className="bg-[#efeae2] flex-1 p-3 flex flex-col gap-2.5 text-left">
                      <div className="bg-white rounded-xl rounded-tl-sm p-3 shadow-xs border border-neutral-200/60">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-semibold">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                          WE ARE LIVE NOW
                        </div>
                        <p className="mt-2 text-[11px] text-[#111111] leading-relaxed">
                          Doors are open for{" "}
                          <strong>Nairobi Real Estate Masterclass</strong>. Tap
                          below to enter Zoom directly:
                        </p>
                        <div className="mt-2.5 w-full rounded-xl bg-[#111111] text-white py-2 px-3 text-[11px] font-medium flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5 text-emerald-400" />
                            Join Live Room
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[9.5px] font-mono text-neutral-400">
                          <span>showup.eris.co.ke/j/live</span>
                          <span className="text-[#1877f2] font-bold">✓✓</span>
                        </div>
                      </div>
                    </div>
                  </PhoneChrome>
                </div>
              </>
            )}

            {activeTab === "Before & After Lift" && (
              <>
                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="18:50" badge="Email Only · 18% Show-Up">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="text-[10px] font-mono text-red-500 font-semibold">
                        GMAIL PROMOTIONS TAB
                      </div>
                      <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                        <div className="text-[11px] font-semibold text-neutral-500 line-through">
                          Reminder: Webinar starts in 1h
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-1">
                          Buried under 214 unread promo emails. 82 of 100 leads
                          never saw this link.
                        </div>
                      </div>
                      <div className="mt-auto mb-3 p-3 rounded-xl bg-red-50/70 border border-red-200/70 text-[11px] text-red-700 font-mono">
                        Result: 18 live attendees / 100 leads
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="19:00" badge="ShowUp Engine · 54% Lift">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="text-[10px] font-mono text-emerald-700 font-semibold">
                        5-TOUCH WHATSAPP SEQUENCE
                      </div>
                      <div className="flex flex-col gap-1.5 text-[10.5px]">
                        {[
                          "T+0s Seat Confirmed",
                          "T+2m Calendar Lock",
                          "T-24h Value Hook",
                          "T-1h Urgency Ping",
                          "T-5m Direct Room Tap",
                        ].map((step) => (
                          <div
                            key={step}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60"
                          >
                            <span className="font-medium text-[#111111]">
                              {step}
                            </span>
                            <Check className="w-3 h-3 text-emerald-600" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-auto mb-3 p-2.5 rounded-xl bg-[#111111] text-white text-[11px] font-mono">
                        Result: 54 live attendees / 100 leads
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="20:30" badge="Tracked Shortlinks & ROI">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#1877f2] font-semibold">
                        <TrendingUp className="w-3.5 h-3.5" /> POST-WEBINAR REPORT
                      </div>
                      <div className="rounded-xl bg-neutral-50 border border-neutral-200 p-3">
                        <div className="text-2xl font-bold font-mono text-[#111111]">
                          3.0× room lift
                        </div>
                        <div className="text-[10.5px] text-neutral-500 mt-1">
                          115 of 212 registrants joined via tracked /j/ links
                        </div>
                      </div>
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-[11px]">
                        <div className="text-emerald-800 font-semibold">
                          KES 640,000 M-Pesa Sales
                        </div>
                        <div className="text-emerald-700/80 text-[10px] mt-0.5">
                          Launch fee cost: KES 1,500
                        </div>
                      </div>
                    </div>
                  </PhoneChrome>
                </div>
              </>
            )}

            {activeTab === "M-Pesa STK Flow" && (
              <>
                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="10:15" badge="1 · Build & Test Free">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="text-[11px] font-semibold text-[#111111]">
                        Free Sandbox Ready
                      </div>
                      <p className="text-[10.5px] text-neutral-600 leading-relaxed">
                        Connect your Zoom link, customize all 5 templates, and
                        send a live WhatsApp test to your own number for KES 0.
                      </p>
                      <div className="mt-auto mb-3 p-3 rounded-xl bg-neutral-100 text-[11px] font-mono text-[#111111]">
                        Setup Cost: KES 0 (No card)
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="10:18" badge="2 · Safaricom STK Push">
                    <div className="p-3.5 flex flex-col justify-center bg-neutral-900/5 flex-1">
                      <div className="bg-white rounded-2xl border border-neutral-200 p-3.5 shadow-md text-left">
                        <div className="text-[10px] font-mono font-bold text-emerald-700">
                          M-PESA EXPRESS
                        </div>
                        <p className="text-[11px] text-[#111111] mt-1.5 leading-relaxed">
                          Pay <strong>KES 1,500</strong> to ShowUp Engine for
                          Single Webinar Launch Pass. Enter PIN.
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" />
                          <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                        </div>
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="10:19" badge="3 · 30% Guarantee Active">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <ShieldCheck className="w-4 h-4" />
                        Launch Pass Confirmed
                      </div>
                      <p className="text-[10.5px] text-neutral-600 leading-relaxed">
                        Up to 200 registrants unlocked. Zero monthly lock-in.
                        If under 30% join live, receive a full M-Pesa refund.
                      </p>
                      <div className="mt-auto mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[10.5px] font-mono text-emerald-800">
                        Receipt: UKD2L2AP3Z · Active
                      </div>
                    </div>
                  </PhoneChrome>
                </div>
              </>
            )}

            {activeTab === "Sample Registration" && (
              <>
                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="12:30" badge="Hosted Page · /r/slug">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="text-[11px] font-semibold text-[#111111]">
                        Nairobi Real Estate Masterclass
                      </div>
                      <div className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] text-neutral-500">
                        Wanjiru Kamau
                      </div>
                      <div className="rounded-lg border border-neutral-200 px-2.5 py-1.5 text-[10px] font-mono text-[#111111]">
                        +254 717 297 022
                      </div>
                      <div className="mt-1 rounded-full bg-[#111111] text-white text-center py-2 text-[11px] font-medium">
                        Reserve Seat on WhatsApp
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="12:30" badge="+254 Auto-Normalization">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-[#1877f2] font-semibold">
                        <Smartphone className="w-3.5 h-3.5" /> LEAD CAPTURE SYNC
                      </div>
                      <p className="text-[10.5px] text-neutral-600 leading-relaxed">
                        Supports 07XX, 01XX, and Meta Lead Ads webhooks. Every
                        Kenyan number is cleaned to +254 format before QStash
                        scheduling.
                      </p>
                      <div className="mt-auto mb-3 p-2.5 rounded-xl bg-neutral-100 text-[10px] font-mono text-neutral-700">
                        0717297022 → +254717297022 ✓
                      </div>
                    </div>
                  </PhoneChrome>
                </div>

                <div className="bg-[#f4f4f4] rounded-2xl pt-6 px-4 pb-0 flex flex-col items-center overflow-hidden border border-neutral-200/70">
                  <PhoneChrome time="12:31" badge="5 Messages Queued">
                    <div className="p-3.5 flex flex-col gap-2.5 text-left bg-white flex-1">
                      <div className="text-[11px] font-semibold text-[#111111]">
                        Automated EAT Queue
                      </div>
                      <p className="text-[10.5px] text-neutral-600 leading-relaxed">
                        All 5 reminder dispatches are queued in East Africa Time
                        via Upstash QStash right after registration.
                      </p>
                      <div className="mt-auto mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[10px] font-mono text-emerald-800">
                        T+0s delivered in 1.4s ✓
                      </div>
                    </div>
                  </PhoneChrome>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
