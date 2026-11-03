"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { ShowUpEvent } from "@/lib/types";
import { buildGoogleCalendarUrl, formatEatDate } from "@/lib/default-templates";
import { BrandRibbon, BrandWordmark, InlineAvatarToken } from "@/components/BrandMark";

const MUSE_INPUT =
  "w-full px-6 py-4 rounded-full bg-[#25272c] border border-white/[0.06] text-white text-[15px] placeholder:text-[#8a909e] focus:outline-none focus:border-[#4589ff] transition";

export default function PublicRegistrationPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const [event, setEvent] = useState<ShowUpEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredData, setRegisteredData] = useState<{
    fullName: string;
    phoneE164: string;
    trackingToken: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/state")
      .then((r) => r.json())
      .then((data) => {
        const found = (data.events || []).find(
          (e: ShowUpEvent) => e.slug === slug || e.id === slug
        );
        setEvent(found || data.events?.[0] || null);
      })
      .finally(() => setLoadingEvent(false));
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch(`/api/events/${event.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          email,
          source: "hosted_page",
          consentGiven: consent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setRegisteredData({
        fullName: data.registrant.full_name,
        phoneE164: data.registrant.phone_e164,
        trackingToken: data.registrant.tracking_token,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not complete registration");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-[#8a909e] text-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#4589ff]" />
        Loading registration...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-medium text-white tracking-[-0.03em]">
          Event not found
        </h1>
        <Link
          href="/dashboard"
          className="mt-5 px-5 py-2.5 rounded-full bg-[#25272c] text-sm text-white hover:bg-[#2f3238] transition"
        >
          Return to dashboard
        </Link>
      </div>
    );
  }

  const { dateStr, timeStr } = formatEatDate(event.starts_at);
  const gcalUrl = buildGoogleCalendarUrl({
    title: event.title,
    startsAtIso: event.starts_at,
  });

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col justify-between">
      {/* Edge-to-edge borderless Muse header */}
      <header className="w-full px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-[#1877f2] hover:bg-[#2e86f8] text-white font-medium text-xs sm:text-sm px-4 py-2 transition"
        >
          Host dashboard
        </Link>
      </header>

      {/* Centerpiece — direct on velvet charcoal canvas like Meta Muse */}
      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 my-auto text-center">
        <div className="mb-6 flex justify-center">
          <BrandRibbon className="w-16 h-14 sm:w-20 sm:h-16" />
        </div>

        <h1 className="text-3xl sm:text-5xl font-medium tracking-[-0.034em] leading-[1.12] text-white">
          {event.title}
          <InlineAvatarToken />
        </h1>

        <p className="mt-4 text-sm sm:text-base text-[#9ca3af] max-w-lg mx-auto leading-relaxed">
          Hosted by <span className="text-white">{event.host_name}</span>. Discover{" "}
          {event.teaser_hook}.
        </p>

        <div className="mt-5 flex items-center justify-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#17191e] border border-white/[0.06] text-xs text-[#e2e8f0]">
            <Calendar className="w-3.5 h-3.5 text-[#4589ff]" />
            {dateStr}
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#17191e] border border-white/[0.06] text-xs text-[#e2e8f0] font-mono tracking-tight">
            <Clock className="w-3.5 h-3.5 text-[#4589ff]" />
            {timeStr} EAT
          </span>
        </div>

        <div className="mt-9 max-w-md mx-auto">
          {registeredData ? (
            <div className="p-7 rounded-3xl bg-[#17191e] border border-white/[0.06] space-y-5 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4589ff]/15 text-[#4589ff] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-medium text-white tracking-[-0.02em]">
                  You&apos;re in, {registeredData.fullName}.
                </h2>
                <p className="text-xs text-[#9ca3af] leading-relaxed">
                  We sent your confirmation to WhatsApp{" "}
                  <strong className="text-white font-mono tracking-tight">
                    +{registeredData.phoneE164}
                  </strong>
                  . Your 5-stage reminder sequence is active.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <a
                  href={gcalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-xs font-medium text-white transition"
                >
                  <Calendar className="w-4 h-4 text-[#4589ff]" />
                  Add to Google Calendar
                </a>
                <a
                  href={`/j/${registeredData.trackingToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-xs font-medium text-white transition"
                >
                  Test tracked join link
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="text-sm text-[#b0b6c2] mb-3">
                Reserve your live seat on WhatsApp
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-500/10 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <input
                type="text"
                required
                aria-label="Full name"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={MUSE_INPUT}
              />

              <input
                type="tel"
                required
                aria-label="WhatsApp phone number"
                placeholder="WhatsApp number (+254 712 345 678)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${MUSE_INPUT} font-mono tracking-tight`}
              />

              <input
                type="email"
                aria-label="Email (optional)"
                placeholder="Email address (optional backup)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={MUSE_INPUT}
              />

              <label className="flex items-start justify-center gap-2 text-[11px] text-[#8a909e] cursor-pointer py-2 px-2 leading-relaxed">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 accent-[#4589ff] rounded"
                />
                <span>
                  You&apos;ll receive WhatsApp reminders and your private join link for
                  this live session. Reply STOP anytime.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full font-medium text-[15px] text-white bg-[#4589ff] hover:bg-[#5896ff] transition active:scale-[0.99] disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Secure My Live Seat on WhatsApp
              </button>
            </form>
          )}
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-[#686e7a]">
        Powered by ShowUp · Official Meta WhatsApp Cloud API
      </footer>
    </div>
  );
}
