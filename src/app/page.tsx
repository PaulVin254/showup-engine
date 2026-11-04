"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  Loader2,
  Lock,
  Send,
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

const BTN_PRIMARY =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium transition active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4589ff]/60";
const BTN_CHARCOAL =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-[#f1f5f9] font-medium transition active:scale-[0.99]";
const PILL_INPUT =
  "w-full px-5 py-3.5 rounded-full bg-[#25272c] border border-white/[0.08] text-white text-sm placeholder:text-[#8a909e] focus:outline-none focus:border-[#4589ff] transition";

export default function LandingPage() {
  const [mascotVariant, setMascotVariant] = useState<"simba" | "creator">("simba");
  const [testPhone, setTestPhone] = useState("");
  const [testEventTitle, setTestEventTitle] = useState(
    "Free Real Estate Masterclass, Saturday 7pm"
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainerRef = useRef<HTMLDivElement>(null);
  const [ahaResult, setAhaResult] = useState<{
    toPhoneE164: string;
    previewText: string;
    senderLabel: string;
    simulated?: boolean;
    capped?: boolean;
    message?: string;
  } | null>(null);

  // Initialize invisible Turnstile bot protection if site key is configured
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (typeof window === "undefined" || !siteKey || !turnstileContainerRef.current) return;

    const interval = setInterval(() => {
      const w = window as unknown as {
        turnstile?: {
          render: (
            container: HTMLElement,
            params: { sitekey: string; callback: (token: string) => void }
          ) => void;
        };
      };
      if (w.turnstile && turnstileContainerRef.current) {
        clearInterval(interval);
        w.turnstile.render(turnstileContainerRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const handleSendTestReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);

    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: testPhone || "0712345678",
          recipientName: "Wanjiku",
          eventTitle:
            testEventTitle.trim() || "Free Real Estate Masterclass",
          templateName: "event_registration_confirmed",
          turnstileToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not send test reminder");
      }

      setAhaResult({
        toPhoneE164: data.toPhoneE164,
        previewText:
          data.previewText ||
          `Hi Wanjiku 👋 You're confirmed for *${testEventTitle}*, Sat 7:00 PM. I'll remind you before we start. Reply 1 to confirm you're coming.`,
        senderLabel:
          data.senderLabel || "ShowUp Verified Number (+254 727 838624)",
        simulated: data.simulated,
        capped: data.capped,
        message: data.message,
      });
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed sending test message"
      );
    } finally {
      setSending(false);
    }
  };

  const setupHref = `/dashboard?setup=1&title=${encodeURIComponent(
    testEventTitle.replace(/,.*$/, "").trim() || "Free Real Estate Masterclass"
  )}&phone=${encodeURIComponent(testPhone || "0712345678")}`;

  return (
    <div className="min-h-screen bg-canvas text-slate-100">
      {/* Edge-to-edge borderless Muse header */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() =>
              setMascotVariant((v) => (v === "simba" ? "creator" : "simba"))
            }
            className="hidden md:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#17191e] border border-white/[0.06] text-[#9ca3af] hover:text-white transition"
            title="Switch Kenyan 3D Mascot Token"
          >
            <Sparkles className="w-3 h-3 text-[#fbbf24]" />
            Mascot: {mascotVariant === "simba" ? "Simba Cub" : "Maasai Creator"}
          </button>

          <Link
            href="/r/nairobi-real-estate-masterclass"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#9ca3af] hover:text-white transition"
          >
            Live registration page
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

      {/* Muse Hero + Instant <60s Test Reminder Box */}
      <section className="pt-8 sm:pt-14 pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Free-floating Kenyan Shield-Wave Ribbon Mark */}
          <div className="mb-6 flex justify-center">
            <BrandRibbon className="w-20 h-16 sm:w-24 sm:h-20" />
          </div>

          {/* 2-line medium-weight grotesque headline with Kenyan 3D Mascot & Chart tokens */}
          <h1 className="text-4xl sm:text-6xl md:text-[64px] font-medium tracking-[-0.035em] leading-[1.12] text-white">
            ShowUp
            <InlineAvatarToken variant={mascotVariant} />
            , your Facebook leads
            <br className="hidden sm:inline" />{" "}
            read WhatsApp, not email
            <InlineChartToken />
          </h1>

          {/* Concise 2-line subtitle */}
          <p className="mt-5 text-base sm:text-lg text-[#9ca3af] leading-relaxed max-w-2xl mx-auto font-normal">
            Get 2–3× more people into your live webinar with automatic WhatsApp
            reminders in East Africa Time. Set up in 3 minutes. Pay via M-Pesa
            only when you launch.
          </p>

          {/* Interactive "Send me a test reminder" Card right in the Hero (No Signup Required) */}
          <div className="mt-9 max-w-2xl mx-auto bg-[#17191e] border border-white/[0.08] rounded-3xl p-5 sm:p-7 text-left shadow-2xl">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-[#e2e8f0]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Try it in 10 seconds — no signup required
              </div>
              <span className="text-[11px] font-mono text-[#8a909e] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Anti-Spam Protected
              </span>
            </div>

            <form
              onSubmit={handleSendTestReminder}
              className="grid grid-cols-1 sm:grid-cols-12 gap-3"
            >
              <div className="sm:col-span-4">
                <label className="block text-[11px] text-[#8a909e] mb-1.5 ml-3">
                  Your WhatsApp number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className={`${PILL_INPUT} font-mono tracking-tight`}
                />
              </div>

              <div className="sm:col-span-5">
                <label className="block text-[11px] text-[#8a909e] mb-1.5 ml-3">
                  Your webinar or masterclass
                </label>
                <input
                  type="text"
                  required
                  placeholder="Free Real Estate Masterclass, Sat 7pm"
                  value={testEventTitle}
                  onChange={(e) => setTestEventTitle(e.target.value)}
                  className={PILL_INPUT}
                />
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  disabled={sending}
                  className={`${BTN_PRIMARY} w-full py-3.5 px-5 text-sm whitespace-nowrap`}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Send test
                    </>
                  )}
                </button>
              </div>

              {/* Invisible Cloudflare Turnstile Hook */}
              <div ref={turnstileContainerRef} className="hidden" />
            </form>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#8a909e] px-1">
              <span>Capped to 1 live reminder per number every 24 hours.</span>
              <span className="hidden sm:inline">Official Meta Cloud API</span>
            </div>

            {error && (
              <div className="mt-3 px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                {error}
              </div>
            )}

            {/* Instant Aha! Moment Reveal */}
            {ahaResult && (
              <div className="mt-6 pt-6 border-t border-white/[0.08] space-y-5 animate-in fade-in duration-300">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    {ahaResult.message || `Dispatched to +${ahaResult.toPhoneE164} from ${ahaResult.senderLabel}`}
                  </div>
                  <span className="text-[11px] text-[#8a909e]">
                    Stage 1 of 5 • Instant confirmation
                  </span>
                </div>

                {/* Authentic WhatsApp Bubble on their phone */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#0b141a] border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      WhatsApp message on your phone right now
                    </span>
                    <span className="font-mono text-[#8a909e]">Just now ✓✓</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                    {ahaResult.previewText}
                  </p>
                </div>

                {/* Remaining 4 stages timeline strip */}
                <div className="space-y-2">
                  <div className="text-xs text-[#9ca3af] font-medium">
                    And here is the automatic countdown sequence that follows:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                    {[
                      {
                        time: "In 2 mins",
                        title: "1-Click Calendar Lock-In",
                      },
                      {
                        time: "Tomorrow 7:00 PM",
                        title: "24h Value Teaser",
                      },
                      {
                        time: "Sat 6:00 PM",
                        title: "1h Countdown Alert",
                      },
                      {
                        time: "Sat 6:55 PM",
                        title: "🔴 Live Join Link",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="p-3 rounded-2xl bg-[#25272c] border border-white/[0.06]"
                      >
                        <div className="text-[11px] font-mono text-[#4589ff] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.time}
                        </div>
                        <div className="text-white font-medium mt-1">
                          {item.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Second Prompt: Add your real event */}
                <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#25272c]/70 p-4 rounded-2xl border border-[#4589ff]/30">
                  <div className="text-xs sm:text-sm text-white">
                    <strong>This is what your leads will get.</strong> Ready to
                    set up your real webinar in 2 minutes?
                  </div>
                  <Link
                    href={setupHref}
                    className={`${BTN_PRIMARY} w-full sm:w-auto px-6 py-3 text-sm shrink-0`}
                  >
                    Add your real event
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Quick Links below the test box */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-[#8a909e]">
            <span>15% → 54% average show-up jump</span>
            <span>•</span>
            <span>No Meta WABA setup required to start</span>
            <span>•</span>
            <Link
              href={setupHref}
              className="text-white hover:text-[#4589ff] underline underline-offset-4 transition"
            >
              Skip test &amp; create your webinar →
            </Link>
          </div>
        </div>
      </section>

      {/* Proof Bar */}
      <section className="py-10 border-y border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              15% → 54%
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Typical webinar show-up rate lift in Kenya
            </div>
          </div>
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              3 mins
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Instant setup using ShowUp&apos;s verified sender
            </div>
          </div>
          <div>
            <div className="font-mono tracking-tight text-3xl font-medium text-white">
              KES 1,500
            </div>
            <div className="text-xs text-[#8a909e] mt-1">
              Pay per webinar via M-Pesa • No monthly lock-in
            </div>
          </div>
        </div>
      </section>

      {/* 5-Stage Sequence Preview */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Five timed touches that fill the room.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              Every registrant receives this automated sequence in East Africa
              Time (EAT).
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

      {/* Lean Pay-Per-Webinar Pricing */}
      <section className="py-20 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-5xl font-medium tracking-[-0.032em] text-white">
              Pay per webinar. Zero monthly bloat.
            </h2>
            <p className="text-sm sm:text-base text-[#8a909e] mt-3">
              Build your event, share your registration page, and load your
              leads for free. Pay via M-Pesa only when you press launch.
            </p>
          </div>

          <div className="rounded-3xl p-7 sm:p-10 bg-[#17191e] border border-[#4589ff]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4589ff]/15 text-[#4589ff] text-xs font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                30% Show-Up Guarantee or M-Pesa Refund
              </div>
              <h3 className="text-2xl font-medium text-white tracking-[-0.02em]">
                Single Webinar Launch Pass
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#9ca3af]">
                {[
                  "Up to 200 registrants included (KES 3,000 for 500 leads)",
                  "Hosted registration page + CSV paste/upload + Meta Lead Ads",
                  "All 5 automated WhatsApp reminders in East Africa Time",
                  "Instant launch on ShowUp's verified sender (or connect your own WABA later)",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-[#4589ff] shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full sm:w-auto sm:text-right shrink-0 space-y-4 bg-[#25272c] p-6 rounded-3xl border border-white/[0.06]">
              <div>
                <div className="text-xs text-[#8a909e]">One-time launch pass</div>
                <div className="font-mono tracking-tight text-4xl font-medium text-white mt-1">
                  KES 1,500
                </div>
                <div className="text-[11px] text-[#8a909e] mt-0.5">
                  per webinar via M-Pesa STK
                </div>
              </div>
              <Link
                href={setupHref}
                className={`${BTN_PRIMARY} w-full px-7 py-3.5 text-sm`}
              >
                Create your webinar free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[11px] text-[#8a909e] text-center">
                Free until you press launch
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-white/[0.06] text-center text-xs text-[#7c828e]">
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
