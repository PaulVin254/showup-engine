"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Send,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { fireTactileConfetti, soundFx } from "@/lib/interactive-delight";

interface HeroTestWidgetProps {
  onSuccessToast?: (msg: string) => void;
}

const PRESET_TOPICS = [
  "Real Estate Masterclass",
  "Crypto & Forex Academy",
  "High-Ticket Consulting",
  "E-Commerce Launch",
];

export function HeroTestWidget({ onSuccessToast }: HeroTestWidgetProps) {
  const [phone, setPhone] = useState("0717 297 022");
  const [title, setTitle] = useState("Free Real Estate Masterclass, Sat 7pm");
  const [sending, setSending] = useState(false);
  const [resultStatus, setResultStatus] = useState<string | null>(null);
  const [deliveredWamid, setDeliveredWamid] = useState<string | null>(null);
  const [isCapped, setIsCapped] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const sendBtnRef = useRef<HTMLButtonElement | null>(null);

  const cleanTitle = title.trim() || "Free Real Estate Masterclass";

  const toggleSound = () => {
    const nextState = !soundEnabled;
    soundFx.soundEnabled = nextState;
    setSoundEnabled(nextState);
    if (nextState) {
      soundFx.playClick();
    }
  };

  const handleSelectTopic = (topic: string) => {
    soundFx.playClick();
    setTitle(`${topic}, Sat 7pm`);
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();

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
      if (data.capped) {
        setIsCapped(true);
      } else {
        soundFx.playWhatsAppPop();
        if (sendBtnRef.current) {
          const rect = sendBtnRef.current.getBoundingClientRect();
          fireTactileConfetti(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
          );
        } else {
          fireTactileConfetti();
        }
      }

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
    <div className="relative max-w-2xl mx-auto mt-8 text-left w-full px-1 sm:px-0">
      {/* Main Minimalist Hairline Card Container */}
      <div className="neat-card p-4 sm:p-7 space-y-4 text-slate-100 border-hairline w-full">
        {/* Top Status & Security Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-medium text-white tracking-tight text-[11px] sm:text-xs">
              Meta Cloud API Connected
            </span>
            <span className="hidden sm:inline font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ~1.2s delivery
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              1 test / 24h
            </span>
            <button
              type="button"
              onClick={toggleSound}
              className="hover:text-white transition p-1"
              title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Input Form — Stacks smoothly on Mobile */}
        <form onSubmit={handleSendTest} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            {/* Phone Input with Kenyan Flag Capsule */}
            <div className="neat-input flex items-center px-3 py-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 pr-2 mr-2 border-r border-white/10 text-xs font-mono text-slate-300 shrink-0">
                <span className="text-sm">🇰🇪</span>
                <span className="font-semibold">+254</span>
              </div>
              <input
                type="tel"
                required
                placeholder="712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Webinar Title Input */}
            <div className="neat-input flex items-center px-3 py-2.5 flex-1 min-w-0">
              <Calendar className="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" />
              <input
                type="text"
                required
                placeholder="Your Webinar Topic"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none truncate"
              />
            </div>

            {/* High-Contrast Action Button */}
            <button
              ref={sendBtnRef}
              type="submit"
              disabled={sending}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-semibold text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {sending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send test</span>
                </>
              )}
            </button>
          </div>

          {/* Quick-Pick Topics */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 font-medium text-slate-500">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Try:
            </span>
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleSelectTopic(topic)}
                className="px-2.5 py-0.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-slate-300 hover:text-white transition text-[11px]"
              >
                {topic}
              </button>
            ))}
          </div>
        </form>

        {/* Live WhatsApp Message Preview Card */}
        <div className="rounded-2xl bg-[#0b141a] border border-white/[0.08] p-3.5 sm:p-4 space-y-3 shadow-inner">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                S
              </div>
              <div>
                <div className="flex items-center gap-1 font-medium text-white text-xs">
                  <span>ShowUp Verified Sender</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00a884]" />
                </div>
                <div className="text-[10px] text-[#8696a0] font-mono">
                  +254 727 838624 · Official WhatsApp Cloud API
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1f2c34] text-emerald-400">
              {deliveredWamid ? "Delivered" : "Live Simulation"}
            </div>
          </div>

          {/* WhatsApp Message Bubble */}
          <div className="max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-tl-sm bg-[#1f2c34] p-3.5 space-y-2 text-[#e9edef] text-xs shadow-sm border border-white/[0.04]">
            <p className="leading-relaxed">
              Habari <strong className="text-white">Brian</strong> 👋 You&apos;re
              confirmed for{" "}
              <strong className="text-emerald-400 font-medium">
                *{cleanTitle}*
              </strong>
              !
            </p>
            <div className="p-2.5 rounded-xl bg-[#111b21] border border-white/[0.04] text-[11px] font-mono text-slate-300 space-y-0.5">
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
              Save this contact! I&apos;ll buzz you 60 mins &amp; 5 mins before
              doors open with your direct live room link.
            </p>

            {/* Interactive WhatsApp Action Chips */}
            <div className="pt-1.5 space-y-1.5 border-t border-white/[0.08]">
              <div className="py-1.5 px-3 rounded-lg bg-[#2a3942] hover:bg-[#344550] text-center text-[11px] font-medium text-[#00a884] flex items-center justify-center gap-1.5 transition">
                <Calendar className="w-3 h-3" />
                Add to Google Calendar
              </div>
              <div className="py-1.5 px-3 rounded-lg bg-[#2a3942] hover:bg-[#344550] text-center text-[11px] font-medium text-[#00a884] flex items-center justify-center gap-1.5 transition">
                <ExternalLink className="w-3 h-3" />
                Join Live Webinar (Room Link)
              </div>
            </div>

            <div className="flex items-center justify-end gap-1 pt-1 text-[10px] font-mono text-[#8696a0]">
              <span>19:00</span>
              <span className="text-[#53bdeb] font-bold">✓✓</span>
            </div>
          </div>

          {/* Delivery result notification */}
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
                <span className="font-mono text-[10px] opacity-75 truncate max-w-[140px]">
                  {deliveredWamid}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Bottom Social Proof & Skip Link */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white font-mono">
              15% → 54%
            </span>
            <span>average attendance jump in Kenya</span>
          </div>

          <Link
            href="/dashboard?setup=1"
            className="text-white hover:text-emerald-400 font-medium inline-flex items-center gap-1 transition group/link"
          >
            Skip test &amp; create your webinar
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
