"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Info,
  Loader2,
  Lock,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface HeroTestWidgetProps {
  onSuccessToast?: (msg: string) => void;
}

const PRESET_TOPICS = [
  "Real Estate Masterclass",
  "Forex & Crypto Trading",
  "High-Ticket Consulting",
  "E-Commerce & Dropshipping",
];

export function HeroTestWidget({ onSuccessToast }: HeroTestWidgetProps) {
  const [phone, setPhone] = useState("0717 297 022");
  const [title, setTitle] = useState("Free Real Estate Masterclass, Sat 7pm");
  const [sending, setSending] = useState(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [deliveredWamid, setDeliveredWamid] = useState<string | null>(null);
  const [isCapped, setIsCapped] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "delivered">("preview");

  const cleanTitle = title.trim() || "Free Real Estate Masterclass";

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResultStatus(null);
    setDeliveredWamid(null);
    setIsCapped(false);

    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: phone,
          recipientName: "Brian",
          eventTitle: cleanTitle,
          templateName: "event_registration_confirmed",
        }),
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        throw new Error(data.error);
      }

      setResultStatus(data.message || "Live reminder dispatched!");
      if (data.wamid) setDeliveredWamid(data.wamid);
      if (data.capped) setIsCapped(true);
      setActiveTab("delivered");

      if (onSuccessToast) {
        onSuccessToast(data.message || "Test sent to WhatsApp!");
      }
    } catch (err: unknown) {
      setResultStatus(
        err instanceof Error ? err.message : "Failed sending live reminder"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative group max-w-2xl mx-auto mt-9 text-left">
      {/* 21st Ambient Glow Aura (Radial blur mesh) */}
      <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-[#2563eb]/25 via-emerald-500/15 to-[#2563eb]/25 opacity-75 blur-xl group-hover:opacity-100 transition-all duration-700 pointer-events-none" />

      {/* Main Glassmorphic Card Container */}
      <div className="relative rounded-[28px] bg-[#13151a]/95 backdrop-blur-2xl border border-white/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.1)] p-5 sm:p-7 space-y-5 overflow-hidden">
        {/* Subtle Top Inner Edge Light */}
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        {/* Top Status & Security Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-white/90 tracking-tight">
              Meta Cloud API Connected
            </span>
            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-mono">
              ~1.2s delivery
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8a909e]">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Anti-Spam Protected
            </span>
            <span>·</span>
            <span>1 / 24h</span>
          </div>
        </div>

        {/* Interactive Segmented Input Form */}
        <form onSubmit={handleSendTest} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 p-2 rounded-2xl bg-[#0c0d10] border border-white/[0.08] shadow-inner">
            {/* Phone Input with Kenyan Flag Capsule */}
            <div className="md:col-span-5 flex items-center bg-[#17191e] border border-white/[0.06] rounded-xl px-3 py-2.5 focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6]/40 transition">
              <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-white/[0.08] text-xs font-mono text-[#94a3b8] shrink-0">
                <span className="text-sm">🇰🇪</span>
                <span>+254</span>
              </div>
              <input
                type="tel"
                required
                placeholder="712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-mono placeholder:text-[#555a64] focus:outline-none"
              />
            </div>

            {/* Webinar Title Input */}
            <div className="md:col-span-4 flex items-center bg-[#17191e] border border-white/[0.06] rounded-xl px-3 py-2.5 focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6]/40 transition">
              <Calendar className="w-3.5 h-3.5 text-[#3b82f6] mr-2 shrink-0" />
              <input
                type="text"
                required
                placeholder="Your Webinar Topic"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-white text-xs placeholder:text-[#555a64] focus:outline-none truncate"
              />
            </div>

            {/* Send Button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={sending}
                className="w-full h-full py-2.5 px-4 rounded-xl font-medium text-xs text-white bg-gradient-to-r from-[#2563eb] via-[#1d4ed8] to-[#1e40af] hover:from-[#3b82f6] hover:to-[#2563eb] transition-all shadow-[0_4px_16px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {sending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick-Pick Topics */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#8a909e]">
            <span className="flex items-center gap-1 text-[#64748b]">
              <Sparkles className="w-3 h-3 text-[#3b82f6]" /> Try:
            </span>
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setTitle(`${topic}, Sat 7pm`)}
                className="px-2.5 py-0.5 rounded-full bg-[#1c1e24] hover:bg-[#252830] border border-white/[0.06] text-[#cbd5e1] hover:text-white transition"
              >
                {topic}
              </button>
            ))}
          </div>
        </form>

        {/* ================================================================= */}
        {/* LIVE REAL-TIME WHATSAPP PHONE MOCKUP PREVIEW                      */}
        {/* ================================================================= */}
        <div className="rounded-2xl bg-[#0b141a] border border-emerald-500/20 p-4 space-y-3 shadow-inner">
          {/* WhatsApp Header Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                S
              </div>
              <div>
                <div className="flex items-center gap-1 font-medium text-white text-xs">
                  <span>ShowUp Verified Sender</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884] fill-[#00a884]/20" />
                </div>
                <div className="text-[10px] text-[#8696a0] font-mono">
                  +254 727 838624 · Official WhatsApp Cloud API
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2c34] text-[#00a884]">
              {activeTab === "delivered" ? "Delivered" : "Live Preview"}
            </div>
          </div>

          {/* WhatsApp Message Bubble */}
          <div className="max-w-[92%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-[#1f2c34] p-3.5 space-y-2 text-[#e9edef] text-xs shadow-md border border-white/[0.04]">
            <p className="leading-relaxed">
              Hi <strong className="text-white">Brian</strong> 👋 You&apos;re
              confirmed for{" "}
              <strong className="text-emerald-400 font-medium">
                *{cleanTitle}*
              </strong>
              !
            </p>
            <div className="p-2 rounded-xl bg-[#111b21] border border-white/[0.04] text-[11px] font-mono text-[#8696a0] space-y-0.5">
              <div className="flex items-center gap-1.5 text-white">
                <Calendar className="w-3 h-3 text-[#00a884]" />
                <span>Saturday, 14 Nov</span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <Clock className="w-3 h-3 text-[#00a884]" />
                <span>7:00 PM East Africa Time (EAT)</span>
              </div>
            </div>
            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              Drop your questions here anytime. I&apos;ll buzz you 60 mins &amp;
              5 mins before we open the room!
            </p>

            {/* Interactive WhatsApp Action Buttons Mockup */}
            <div className="pt-1.5 space-y-1.5 border-t border-white/[0.08]">
              <div className="py-1.5 px-3 rounded-lg bg-[#2a3942] text-center text-[11px] font-medium text-[#00a884] flex items-center justify-center gap-1.5">
                <Calendar className="w-3 h-3" />
                Add to Google Calendar
              </div>
              <div className="py-1.5 px-3 rounded-lg bg-[#2a3942] text-center text-[11px] font-medium text-[#00a884] flex items-center justify-center gap-1.5">
                <ExternalLink className="w-3 h-3" />
                Join Live Webinar (Room Link)
              </div>
            </div>

            {/* Double Blue Checkmarks */}
            <div className="flex items-center justify-end gap-1 pt-1 text-[10px] font-mono text-[#8696a0]">
              <span>19:00</span>
              <span className="text-[#53bdeb] font-bold">✓✓</span>
            </div>
          </div>

          {/* Result Notification Banner if send was clicked */}
          {resultStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 ${
                isCapped
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-300"
                  : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{resultStatus}</span>
              </div>
              {deliveredWamid && (
                <span className="font-mono text-[10px] opacity-75 truncate max-w-[150px]">
                  {deliveredWamid}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Social Proof & Skip Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a909e] pt-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">15% → 54%</span>
            <span>average attendance jump in Kenya</span>
          </div>

          <Link
            href="/dashboard?setup=1"
            className="text-white hover:text-[#3b82f6] font-medium inline-flex items-center gap-1 transition group/link"
          >
            Skip test &amp; create your webinar
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
