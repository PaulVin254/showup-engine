"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Calendar, Check, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { ShowUpEvent } from "@/lib/types";
import { buildGoogleCalendarUrl, formatEatDate } from "@/lib/default-templates";
import { BrandWordmark } from "@/components/BrandMark";

const LIGHT_INPUT =
  "w-full px-4 py-3 rounded-xl bg-white border border-neutral-200 text-[#111111] text-[14px] placeholder:text-neutral-400 focus:outline-none focus:border-[#111111] focus:ring-2 focus:ring-neutral-900/10 transition";

const WHAT_HAPPENS = [
  "Instant WhatsApp seat confirmation",
  "1-click Google Calendar lock",
  "24h & 60m EAT reminders before start",
  "Private live room link 5 mins before doors open",
];

export default function PublicRegistrationPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : "";
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
    if (!slug) {
      setLoadingEvent(false);
      return;
    }
    fetch(`/api/events/public/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : { event: null }))
      .then((data) => {
        setEvent(data.event || null);
      })
      .catch(() => setEvent(null))
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
      <div className="min-h-screen bg-[#f6f6f7] flex items-center justify-center text-neutral-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#111111]" />
        Loading registration...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#f6f6f7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-semibold text-[#111111] tracking-[-0.03em]">
          Event not found
        </h1>
        <Link
          href="/dashboard"
          className="mt-5 px-5 py-2.5 rounded-full bg-[#111111] text-sm font-medium text-white hover:bg-neutral-800 transition"
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
    <div className="min-h-screen bg-[#f6f6f7] text-[#111111] flex flex-col justify-between">
      {/* Minimal Light Header */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 sm:px-10 py-4 flex items-center justify-between">
        <Link href="/" aria-label="ShowUp Home">
          <BrandWordmark />
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-full bg-[#f4f4f5] hover:bg-neutral-200/80 border border-neutral-200 text-[#111111] font-medium text-xs sm:text-sm px-4 py-2 transition"
        >
          Host dashboard
        </Link>
      </header>

      {/* Split Cal.com / Dub.co Event Card inside Recessed Mobbin Tray */}
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 my-auto">
        <div className="rounded-[28px] bg-[#ececee] p-2 sm:p-3 border border-neutral-200/90 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.08)]">
          <div className="bg-white rounded-[22px] border border-neutral-200/80 overflow-hidden grid grid-cols-1 md:grid-cols-12">
            {/* Left Info Column */}
            <div className="md:col-span-6 p-6 sm:p-8 bg-[#fafafa] border-b md:border-b-0 md:border-r border-neutral-200/80 flex flex-col justify-between gap-6 text-left">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-medium text-[#111111]">
                    <Calendar className="w-3.5 h-3.5 text-[#00a884]" />
                    {dateStr}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-neutral-200 text-xs font-mono text-[#111111]">
                    <Clock className="w-3.5 h-3.5 text-[#00a884]" />
                    {timeStr} EAT
                  </span>
                </div>

                <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-[-0.03em] leading-[1.15] text-[#111111]">
                  {event.title}
                </h1>

                <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
                  {event.host_name && !/^your('?s)?(\s+live\s+room)?$/i.test(event.host_name.trim()) ? (
                    <>
                      Hosted by{" "}
                      <span className="font-medium text-[#111111]">{event.host_name}</span>.{" "}
                    </>
                  ) : null}
                  Discover {event.teaser_hook}.
                </p>
              </div>

              <div className="pt-5 border-t border-neutral-200/80">
                <div className="text-xs font-medium text-neutral-500 mb-3">
                  What happens after you register
                </div>
                <ul className="flex flex-col gap-2.5 text-xs text-neutral-700">
                  {WHAT_HAPPENS.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 border border-emerald-200 text-[#00a884] flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right Registration / Confirmation Column */}
            <div className="md:col-span-6 p-6 sm:p-8 bg-white text-left flex flex-col justify-center">
              {registeredData ? (
                <div className="flex flex-col gap-5 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-[#00a884] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <h2 className="text-xl font-semibold text-[#111111] tracking-[-0.02em]">
                      You&apos;re in, {registeredData.fullName}.
                    </h2>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      We sent your confirmation to WhatsApp{" "}
                      <strong className="text-[#111111] font-mono tracking-tight">
                        +{registeredData.phoneE164}
                      </strong>
                      . Your 5-stage reminder sequence is active.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-2">
                    <a
                      href={gcalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#f4f4f5] hover:bg-neutral-200/80 border border-neutral-200 text-xs font-medium text-[#111111] transition"
                    >
                      <Calendar className="w-4 h-4 text-[#00a884]" />
                      Add to Google Calendar
                    </a>
                    <a
                      href={`/j/${registeredData.trackingToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#111111] hover:bg-neutral-800 text-xs font-medium text-white transition"
                    >
                      Test tracked join link
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#111111] tracking-tight">
                      Reserve your live seat
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Receive reminders and your join link directly on WhatsApp.
                    </p>
                  </div>

                  {error && (
                    <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-name" className="text-xs font-medium text-neutral-700">
                      Full name
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      required
                      placeholder="e.g. Wanjiru Kamau"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={LIGHT_INPUT}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-phone" className="text-xs font-medium text-neutral-700">
                      WhatsApp phone number
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      placeholder="+254 712 345 678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`${LIGHT_INPUT} font-mono tracking-tight`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="reg-email" className="text-xs font-medium text-neutral-700">
                      Email address (optional)
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={LIGHT_INPUT}
                    />
                  </div>

                  <label className="flex items-start gap-2.5 text-[11px] text-neutral-500 cursor-pointer py-1 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      required
                      className="mt-0.5 accent-[#111111] rounded"
                    />
                    <span>
                      Send my WhatsApp reminders and private join link for this live session. Reply
                      STOP anytime.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-medium text-sm text-white bg-[#111111] hover:bg-neutral-800 transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Secure My Live Seat on WhatsApp
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00a884]" />
                    <span>Official Meta WhatsApp Cloud API</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-5 text-center text-xs text-neutral-500 font-mono">
        Powered by ShowUp · Official Meta WhatsApp Cloud API
      </footer>
    </div>
  );
}
