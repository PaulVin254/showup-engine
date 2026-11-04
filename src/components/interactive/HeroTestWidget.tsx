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
  Flame,
  Info,
  Loader2,
  Lock,
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
  const [speechText, setSpeechText] = useState(
    "Jaribu hapa! Send a live WhatsApp test to your phone 👇"
  );

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
    setSpeechText(`Nice topic! "${topic}" converts like crazy on WhatsApp 🔥`);
  };

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (val.length > 3 && !resultStatus) {
      setSpeechText("Looking sharp! Put your Kenyan number 🇰🇪");
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();

    setSending(true);
    setResultStatus(null);
    setDeliveredWamid(null);
    setIsCapped(false);
    setSpeechText("Firing Meta Cloud API... ~1.2s delivery ⚡");

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
        setSpeechText("Daily limit active! 1 live test per number every 24h 🛡️");
      } else {
        setSpeechText("Boom! Delivered! Check your WhatsApp right now! 🚀🎉");
        // Trigger celebratory Web Audio chime & confetti burst
        soundFx.playWhatsAppPop();

        if (sendBtnRef.current) {
          const rect = sendBtnRef.current.getBoundingClientRect();
          fireTactileConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        } else {
          fireTactileConfetti();
        }
      }

      if (onSuccessToast) {
        onSuccessToast(data.message || "Test sent to WhatsApp!");
      }
    } catch (err: unknown) {
      const errMessage =
        err instanceof Error ? err.message : "Failed sending live reminder";
      setResultStatus(errMessage);
      setSpeechText("Oops, check your phone digits and try again!");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative max-w-2xl mx-auto mt-12 text-left">
      {/* =================================================================== */}
      {/* 3D SIMBA MASCOT TOKEN PEEK + REACTIVE SPEECH BUBBLE               */}
      {/* =================================================================== */}
      <div className="flex items-end justify-between px-4 -mb-3 relative z-10 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Tactile 3D Simba Avatar Token */}
          <div
            className="w-13 h-13 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#e8dfd5] border-3 border-[#282d3b] shadow-[0_8px_20px_rgba(0,0,0,0.6)] select-none shrink-0 transition-transform duration-200 hover:scale-110 cursor-pointer"
            onClick={() => {
              soundFx.playWhatsAppPop();
              setSpeechText("Simba says: WhatsApp attendance destroys email! 🦁");
            }}
            title="Simba Mascot — Click to hear roar"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tokens/avatar-token.png"
              alt="Simba Mascot"
              className="w-full h-full object-cover scale-[1.25]"
            />
          </div>

          {/* Pillowy 3D Clay Speech Balloon */}
          <div className="clay-card py-2 px-3.5 sm:px-4 rounded-2xl text-xs font-medium text-amber-200 border border-amber-500/30 flex items-center gap-2 shadow-lg max-w-[280px] sm:max-w-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-pulse" />
            <span className="truncate sm:whitespace-normal">{speechText}</span>
          </div>
        </div>

        {/* Sound FX Toggle Pill */}
        <button
          type="button"
          onClick={toggleSound}
          className="pointer-events-auto clay-btn-charcoal text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[#94a3b8] hover:text-white"
          title={soundEnabled ? "Mute tactile sounds" : "Enable tactile sounds"}
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Audio On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Muted</span>
            </>
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* MAIN MOLDED CLAY CONSOLE DECK (ZERO GLASSMORPHISM)                */}
      {/* =================================================================== */}
      <div className="clay-deck p-5 sm:p-7 space-y-5 text-slate-100">
        {/* Top Hardware Bezel Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#232733]">
          {/* LED Lens & Status */}
          <div className="flex items-center gap-2">
            <span className="clay-led-green animate-pulse" />
            <span className="text-xs font-semibold text-white tracking-tight">
              Meta Cloud API Connected
            </span>
            <span className="hidden sm:inline clay-badge text-[10px] px-2.5 py-0.5 rounded-full text-emerald-400 font-mono">
              ⚡ ~1.2s live delivery
            </span>
          </div>

          {/* Security & Spam Badge */}
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#8a909e]">
            <span className="clay-badge px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 text-[#94a3b8]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Anti-Spam Protected · 1/24h
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* MOLDED CLAY INSET FORM CONTROLS                                  */}
        {/* ================================================================= */}
        <form onSubmit={handleSendTest} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 clay-inset">
            {/* Phone Number Molded Socket */}
            <div className="md:col-span-5 flex items-center bg-[#15181f] border border-[#262c3b] rounded-xl px-3.5 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition shadow-inner">
              <div className="flex items-center gap-1.5 pr-2.5 mr-2.5 border-r border-[#2d3445] text-xs font-mono text-slate-300 shrink-0 select-none">
                <span className="text-base">🇰🇪</span>
                <span className="font-semibold">+254</span>
              </div>
              <input
                type="tel"
                required
                placeholder="712 345 678"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="w-full bg-transparent text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            {/* Topic Input Molded Socket */}
            <div className="md:col-span-4 flex items-center bg-[#15181f] border border-[#262c3b] rounded-xl px-3.5 py-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 transition shadow-inner">
              <Calendar className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
              <input
                type="text"
                required
                placeholder="Your Webinar Topic"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none truncate"
              />
            </div>

            {/* Chunky 3D Physical Push-Down Send Button */}
            <div className="md:col-span-3">
              <button
                ref={sendBtnRef}
                type="submit"
                disabled={sending}
                className="clay-btn-emerald w-full h-full min-h-[46px] py-2.5 px-4 rounded-xl font-semibold text-xs text-white disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send test</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick-Pick Topics (Chunky Clay Pills) */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8a909e] pt-0.5">
            <span className="flex items-center gap-1 font-medium text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Pick preset:
            </span>
            {PRESET_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => handleSelectTopic(topic)}
                className="clay-btn-charcoal px-3 py-1 rounded-full text-slate-300 hover:text-white font-medium text-[11px] transition-colors"
              >
                {topic}
              </button>
            ))}
          </div>
        </form>

        {/* ================================================================= */}
        {/* TACTILE 3D WHATSAPP PHONE DISPLAY SIMULATION                     */}
        {/* ================================================================= */}
        <div className="clay-card p-4 space-y-3.5 bg-[#0b141a] border-2 border-[#193327]">
          {/* WhatsApp Header Screen Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-[#1f2c34] text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white font-bold text-xs shadow-[0_2px_6px_rgba(0,168,132,0.4)]">
                S
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-white text-xs">
                  <span>ShowUp Verified Sender</span>
                  <CheckCircle2 className="w-4 h-4 text-[#00a884] fill-[#00a884]/20" />
                </div>
                <div className="text-[10px] text-[#8696a0] font-mono">
                  +254 727 838624 · Official WhatsApp Cloud API
                </div>
              </div>
            </div>

            <div className="clay-badge text-[10px] font-mono px-2.5 py-1 rounded-md text-[#00a884]">
              {deliveredWamid ? "✓ Delivered to Phone" : "Live Simulation"}
            </div>
          </div>

          {/* Pillowy Clay WhatsApp Speech Balloon */}
          <div className="clay-bubble-wa max-w-[94%] sm:max-w-[88%] p-4 space-y-2.5 text-[#e9edef] text-xs">
            <p className="leading-relaxed">
              Habari <strong className="text-white">Brian</strong> 👋 You&apos;re
              confirmed for{" "}
              <strong className="text-emerald-400 font-semibold">
                *{cleanTitle}*
              </strong>
              !
            </p>

            {/* Inset Session Details Capsule */}
            <div className="clay-inset p-2.5 space-y-1 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2 text-white">
                <Calendar className="w-3.5 h-3.5 text-[#00a884]" />
                <span className="font-medium">Saturday, 14 Nov</span>
              </div>
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-3.5 h-3.5 text-[#00a884]" />
                <span className="font-medium">7:00 PM East Africa Time (EAT)</span>
              </div>
            </div>

            <p className="text-[11px] text-[#8696a0] leading-relaxed">
              Save this contact! I&apos;ll buzz you 60 mins &amp; 5 mins before
              doors open with your direct live room link.
            </p>

            {/* Tactile Pushable Interactive Action Buttons */}
            <div className="pt-2 space-y-2 border-t border-[#2a3942]">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSpeechText("Calendar button clicked! In the real message, this auto-adds to Google Calendar 📅");
                }}
                className="clay-btn-charcoal w-full py-2 px-3 rounded-xl text-center text-[11px] font-medium text-[#00a884] flex items-center justify-center gap-2"
              >
                <Calendar className="w-3.5 h-3.5" />
                Add to Google Calendar
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setSpeechText("Join button tapped! Opens direct live Zoom / YouTube link 🔴");
                }}
                className="clay-btn-charcoal w-full py-2 px-3 rounded-xl text-center text-[11px] font-medium text-[#00a884] flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Join Live Webinar (Room Link)
              </button>
            </div>

            {/* Timestamp & Double Blue Checkmarks */}
            <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] font-mono text-[#8696a0]">
              <span>19:00</span>
              <span className="text-[#53bdeb] font-bold text-xs tracking-tighter">
                ✓✓
              </span>
            </div>
          </div>

          {/* Live Delivery Confirmation Banner */}
          {resultStatus && (
            <div
              className={`p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2.5 shadow-md ${
                isCapped
                  ? "bg-[#291e13] border-2 border-amber-500/40 text-amber-300"
                  : "bg-[#10241b] border-2 border-emerald-500/40 text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    isCapped ? "text-amber-400" : "text-emerald-400"
                  }`}
                />
                <span className="font-medium">{resultStatus}</span>
              </div>
              {deliveredWamid && (
                <span className="font-mono text-[10px] opacity-75 truncate max-w-[140px] clay-badge px-2 py-0.5 rounded">
                  {deliveredWamid}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* BOTTOM METRICS & SKIP LINK                                       */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8a909e] pt-1">
          <div className="flex items-center gap-2">
            <span className="clay-badge px-2 py-0.5 rounded-full font-mono font-bold text-white">
              15% → 54%
            </span>
            <span>average webinar show-up jump in Kenya</span>
          </div>

          <Link
            href="/dashboard?setup=1"
            className="text-white hover:text-emerald-400 font-medium inline-flex items-center gap-1.5 transition group/link"
          >
            Skip test &amp; create your webinar
            <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
