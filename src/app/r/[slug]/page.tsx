"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { ShowUpEvent } from "@/lib/types";
import { buildGoogleCalendarUrl, formatEatDate } from "@/lib/default-templates";

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        Loading Masterclass Registration...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-white">Event Not Found</h1>
        <Link href="/dashboard" className="mt-4 text-emerald-400 underline text-sm">
          Return to Dashboard
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-xl mx-auto w-full my-auto space-y-6">
        {/* Top Badge */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Online Masterclass • East Africa Time (EAT)
          </span>
          <Link
            href="/dashboard"
            className="text-xs text-slate-400 hover:text-emerald-400 underline"
          >
            Host Dashboard →
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="space-y-2">
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Hosted by {event.host_name}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {event.title}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              In this live session, you&apos;ll discover{" "}
              <span className="text-emerald-300 font-medium">{event.teaser_hook}</span>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">Date</div>
                <div className="text-xs sm:text-sm font-bold text-white">{dateStr}</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[11px] text-slate-400">Time (Kenya EAT)</div>
                <div className="text-xs sm:text-sm font-bold text-white">
                  {timeStr} EAT
                </div>
              </div>
            </div>
          </div>

          {registeredData ? (
            <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">
                  You&apos;re Registered, {registeredData.fullName}! ✅
                </h2>
                <p className="text-xs text-slate-300">
                  We just sent your confirmation to WhatsApp{" "}
                  <strong className="text-emerald-300">
                    +{registeredData.phoneE164}
                  </strong>
                  . Your 5-stage reminder sequence is now active!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                <a
                  href={gcalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  Add to Google Calendar
                </a>
                <a
                  href={`/j/${registeredData.trackingToken}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-xs font-bold text-slate-950 transition"
                >
                  Test Tracked Join Link (/j/{registeredData.trackingToken})
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wanjiku Kamau"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  WhatsApp Phone Number (Safaricom / Airtel) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678 or +254 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Your private Zoom/Meet join link will be sent directly to this WhatsApp
                  number.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address (Optional backup)
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  className="mt-0.5 accent-emerald-400 rounded"
                />
                <span>
                  I agree to receive automated WhatsApp event reminders &amp; the live join
                  link for this session. (Reply STOP anytime to opt out).
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                Reserve My Free Seat &amp; Send WhatsApp Confirmation
              </button>
            </form>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Powered by ShowUp Engine • Official Meta WhatsApp Cloud API
        </div>
      </div>
    </div>
  );
}

