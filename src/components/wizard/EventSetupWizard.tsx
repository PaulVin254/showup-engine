"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  Loader2,
  Plus,
  ShieldCheck,
  Smartphone,
  Upload,
} from "lucide-react";
import {
  SenderMode,
  ShowUpEvent,
  ShowUpRegistrant,
  ShowUpTenant,
} from "@/lib/types";
import {
  DEFAULT_WEBINAR_TEMPLATES,
  formatEatDate,
  renderTemplatePreview,
} from "@/lib/default-templates";

interface EventSetupWizardProps {
  tenant: ShowUpTenant;
  initialEvent?: ShowUpEvent | null;
  initialTitle?: string;
  initialPhone?: string;
  eventRegistrants: ShowUpRegistrant[];
  originUrl: string;
  onCancel?: () => void;
  onEventSaved: (event: ShowUpEvent) => Promise<void>;
  onLaunched: (eventId: string, message: string) => Promise<void>;
  onOpenEmbeddedSignup: () => void;
  onToast: (msg: string) => void;
}

const MUSE_INPUT =
  "w-full px-5 py-3.5 rounded-full bg-[#25272c] border border-white/[0.08] text-white text-sm placeholder:text-[#8a909e] focus:outline-none focus:border-[#4589ff] transition";

export function EventSetupWizard({
  tenant,
  initialEvent,
  initialTitle = "",
  initialPhone = "",
  eventRegistrants,
  originUrl,
  onCancel,
  onEventSaved,
  onLaunched,
  onOpenEmbeddedSignup,
  onToast,
}: EventSetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentEvent, setCurrentEvent] = useState<ShowUpEvent | null>(
    initialEvent || null
  );

  // Step 1 state: Your Webinar (30s)
  const [title, setTitle] = useState(
    initialEvent?.title ||
      initialTitle ||
      "Free Real Estate & Passive Income Masterclass"
  );
  const [startsAtLocal, setStartsAtLocal] = useState(() => {
    if (initialEvent?.starts_at) {
      return new Date(initialEvent.starts_at).toISOString().slice(0, 16);
    }
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000);
    d.setUTCHours(16, 0, 0, 0); // 7:00 PM EAT
    return d.toISOString().slice(0, 16);
  });
  const [joinUrl, setJoinUrl] = useState(
    initialEvent?.join_url || "https://meet.google.com/landing"
  );
  const [hostPhone, setHostPhone] = useState(
    initialPhone || tenant.phone_e164 || ""
  );
  const [savingStep1, setSavingStep1] = useState(false);

  // Step 2 state: Add Your People (60s)
  const [leadTab, setLeadTab] = useState<"page" | "paste" | "meta">("page");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState(
    "Grace Muthoni, 0721 884 920\nSamuel Kariuki, 0710 553 190\nEsther Wambui, 0711 442 819"
  );
  const [importingLeads, setImportingLeads] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");

  // Step 3 state: Go Live (60s)
  const [previewIdx, setPreviewIdx] = useState(0);
  const [senderMode, setSenderMode] = useState<SenderMode>(
    initialEvent?.sender_mode || "shared_showup"
  );
  const [passTier, setPassTier] = useState<"event_pass" | "event_scale">(
    "event_pass"
  );
  const [mpesaPhone, setMpesaPhone] = useState(
    initialPhone || tenant.phone_e164 || "0712345678"
  );
  const [paying, setPaying] = useState(false);

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Step 1 Handler
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStep1(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: currentEvent?.id,
          title: title.trim(),
          hostName: tenant.business_name.split(" ")[0] || "Founder",
          hostPhone: hostPhone.trim(),
          startsAt: new Date(startsAtLocal).toISOString(),
          joinUrl: joinUrl.trim(),
          senderMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save webinar");
      setCurrentEvent(data.event);
      if (hostPhone.trim()) {
        setMpesaPhone(hostPhone.trim());
      }
      await onEventSaved(data.event);
      setStep(2);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : "Failed saving webinar");
    } finally {
      setSavingStep1(false);
    }
  };

  // Step 2: Paste or Import CSV Handler
  const handleBulkPasteImport = async () => {
    if (!currentEvent) return;
    const lines = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const rows = lines.map((line) => {
      const parts = line.split(/[,;\t]+/).map((p) => p.trim());
      if (parts.length >= 2) {
        return { name: parts[0], phone: parts[1], email: parts[2] || "" };
      }
      return { name: "Webinar Lead", phone: parts[0] };
    });

    setImportingLeads(true);
    try {
      const res = await fetch(`/api/events/${currentEvent.id}/import-csv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, mode: "registrants" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      onToast(data.message || `Added ${rows.length} people!`);
      await onEventSaved(currentEvent);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : "Failed importing list");
    } finally {
      setImportingLeads(false);
    }
  };

  const handleQuickSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !quickName || !quickPhone) return;
    setImportingLeads(true);
    try {
      const res = await fetch(`/api/events/${currentEvent.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: quickName,
          phone: quickPhone,
          source: "manual_test",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuickName("");
      setQuickPhone("");
      onToast(`Added ${data.registrant.full_name}!`);
      await onEventSaved(currentEvent);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : "Could not add person");
    } finally {
      setImportingLeads(false);
    }
  };

  // Step 3: M-Pesa STK Push & Launch Handler
  const handlePayAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    setPaying(true);
    try {
      const res = await fetch("/api/billing/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: passTier,
          phone: mpesaPhone,
          eventId: currentEvent.id,
          senderMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "M-Pesa payment failed");
      await onLaunched(currentEvent.id, data.message);
    } catch (err: unknown) {
      onToast(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const activeTpl = DEFAULT_WEBINAR_TEMPLATES[previewIdx];
  const eatFormatted = currentEvent
    ? formatEatDate(currentEvent.starts_at)
    : formatEatDate(new Date(startsAtLocal).toISOString());

  const previewValues = [
    "Wanjiku",
    currentEvent?.title || title || "Masterclass",
    eatFormatted.dateStr,
    eatFormatted.timeStr,
    eatFormatted.timeStr,
  ];

  const leadCount = eventRegistrants.length;
  const estimatedAdSpendKes = Math.max(leadCount * 170, 4500);
  const priceKes = passTier === "event_scale" ? 3000 : 1500;

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 sm:p-9 shadow-2xl space-y-7">
        {/* Top Progress Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-xs text-[#8a909e] hover:text-white px-3 py-1.5 rounded-full bg-[#25272c] transition"
                >
                  ← Back
                </button>
              )}
              <span className="text-sm font-medium text-white">
                {step === 1 && "Step 1: Your webinar"}
                {step === 2 && "Step 2: Add your people"}
                {step === 3 && "Step 3: Go live"}
              </span>
            </div>
            <span className="text-xs font-mono text-[#8a909e]">
              Step {step} of 3
            </span>
          </div>

          {/* 3-Node Linear Progress Bar */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { s: 1, label: "1. Your webinar" },
              { s: 2, label: "2. Add your people" },
              { s: 3, label: "3. Go live" },
            ].map((item) => {
              const active = step >= item.s;
              return (
                <button
                  key={item.s}
                  type="button"
                  disabled={item.s > 1 && !currentEvent}
                  onClick={() => {
                    if (item.s === 1 || currentEvent) {
                      setStep(item.s as 1 | 2 | 3);
                    }
                  }}
                  className="text-left group disabled:opacity-40"
                >
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      active ? "bg-[#4589ff]" : "bg-[#25272c]"
                    }`}
                  />
                  <div
                    className={`text-[11px] mt-1.5 font-medium ${
                      step === item.s ? "text-white" : "text-[#8a909e]"
                    }`}
                  >
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 1: YOUR WEBINAR (30s) */}
        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5">
            <div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-white">
                Tell us about your live room.
              </h2>
              <p className="text-xs sm:text-sm text-[#8a909e] mt-1">
                Just 3 details. We pre-fill your 5 East Africa Time WhatsApp
                reminders automatically.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#9ca3af] mb-2 ml-3">
                  What&apos;s your webinar called?
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Real Estate Masterclass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={MUSE_INPUT}
                />
              </div>

              <div>
                <label className="block text-xs text-[#9ca3af] mb-2 ml-3">
                  When does it start?{" "}
                  <span className="text-[#4589ff] font-mono">
                    (East Africa Time · EAT)
                  </span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startsAtLocal}
                  onChange={(e) => setStartsAtLocal(e.target.value)}
                  className={`${MUSE_INPUT} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs text-[#9ca3af] mb-2 ml-3">
                  Where do people join live? (Zoom, Google Meet, or YouTube link)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                  value={joinUrl}
                  onChange={(e) => setJoinUrl(e.target.value)}
                  className={`${MUSE_INPUT} font-mono`}
                />
              </div>

              <div>
                <label className="block text-xs text-[#9ca3af] mb-2 ml-3">
                  Your WhatsApp number{" "}
                  <span className="text-[#8a909e]">
                    (saves your private room &amp; M-Pesa receipt)
                  </span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712 345 678"
                  value={hostPhone}
                  onChange={(e) => setHostPhone(e.target.value)}
                  className={`${MUSE_INPUT} font-mono`}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="submit"
                disabled={savingStep1}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm px-8 py-3.5 transition active:scale-[0.99]"
              >
                {savingStep1 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ADD YOUR PEOPLE (60s) */}
        {step === 2 && currentEvent && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-white">
                  Add your people.
                </h2>
                <p className="text-xs sm:text-sm text-[#8a909e] mt-1">
                  Share your ready-made registration link or paste leads you
                  already collected.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-[#25272c] border border-white/[0.08] text-xs font-mono text-white">
                {leadCount} {leadCount === 1 ? "person" : "people"} ready
              </span>
            </div>

            {/* 3 Segmented Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-full bg-[#101114] border border-white/[0.06]">
              {[
                { id: "page", label: "Registration page" },
                { id: "paste", label: "Paste / Upload list" },
                { id: "meta", label: "Facebook Ads (Adv)" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLeadTab(t.id as typeof leadTab)}
                  className={`py-2 px-3 rounded-full text-xs font-medium transition ${
                    leadTab === t.id
                      ? "bg-[#25272c] text-white shadow"
                      : "text-[#8a909e] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Hosted Registration Page (Default) */}
            {leadTab === "page" && (
              <div className="p-5 sm:p-6 rounded-3xl bg-[#25272c]/60 border border-white/[0.08] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-emerald-400">
                    ✓ Your hosted registration page is live
                  </span>
                  <span className="text-[11px] text-[#8a909e]">
                    Recommended default
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#101114] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <code className="text-xs sm:text-sm text-[#4589ff] font-mono truncate">
                    {originUrl}/r/{currentEvent.slug}
                  </code>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        copyText("regLink", `${originUrl}/r/${currentEvent.slug}`)
                      }
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-xs font-medium text-white transition"
                    >
                      {copiedKey === "regLink" ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy link
                        </>
                      )}
                    </button>
                    <Link
                      href={`/r/${currentEvent.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-xs text-white transition"
                    >
                      Preview
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                <p className="text-xs text-[#9ca3af] leading-relaxed">
                  Drop this link into your Facebook/Instagram ad, bio, or
                  WhatsApp status. Every person who signs up gets added to your
                  webinar automatically.
                </p>
              </div>
            )}

            {/* Tab 2: Paste or Upload List */}
            {leadTab === "paste" && (
              <div className="p-5 rounded-3xl bg-[#25272c]/60 border border-white/[0.08] space-y-4">
                <div>
                  <label className="block text-xs text-white font-medium mb-1.5">
                    Paste names &amp; Kenyan phone numbers (one per line)
                  </label>
                  <textarea
                    rows={4}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder="Wanjiku Kamau, 0712 345 678"
                    className="w-full p-4 rounded-2xl bg-[#101114] border border-white/[0.08] text-xs text-white font-mono focus:outline-none focus:border-[#4589ff]"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-[#8a909e]">
                    Accepts 07XX, 01XX, or +254 formats
                  </span>
                  <button
                    type="button"
                    disabled={importingLeads}
                    onClick={handleBulkPasteImport}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-xs font-medium text-white transition"
                  >
                    {importingLeads ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Add pasted people
                  </button>
                </div>

                {/* Quick single person add */}
                <form
                  onSubmit={handleQuickSingleAdd}
                  className="pt-3 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-12 gap-2"
                >
                  <input
                    type="text"
                    placeholder="Single Name (e.g. Jane)"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="sm:col-span-5 px-4 py-2 rounded-full bg-[#101114] border border-white/[0.08] text-xs text-white"
                  />
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="sm:col-span-4 px-4 py-2 rounded-full bg-[#101114] border border-white/[0.08] text-xs text-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={importingLeads}
                    className="sm:col-span-3 inline-flex items-center justify-center gap-1 px-4 py-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-xs font-medium text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add 1
                  </button>
                </form>
              </div>
            )}

            {/* Tab 3: Facebook Lead Ads Webhook (Advanced) */}
            {leadTab === "meta" && (
              <div className="p-5 rounded-3xl bg-[#25272c]/60 border border-white/[0.08] space-y-3">
                <div className="text-xs font-medium text-white">
                  Instant Webhook for Meta Lead Ads / Zapier / Make
                </div>
                <p className="text-xs text-[#9ca3af]">
                  Send a <code className="text-white">POST</code> request with{" "}
                  <code className="text-white">
                    &#123; fullName, phone &#125;
                  </code>{" "}
                  to trigger the 5-stage sequence automatically:
                </p>
                <div className="p-3.5 rounded-2xl bg-[#101114] border border-white/[0.08] flex items-center justify-between gap-2">
                  <code className="text-xs text-[#4589ff] font-mono truncate">
                    {originUrl}/api/events/{currentEvent.id}/register
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        "whLink",
                        `${originUrl}/api/events/${currentEvent.id}/register`
                      )
                    }
                    className="px-3.5 py-1.5 rounded-full bg-[#25272c] text-xs text-white shrink-0"
                  >
                    {copiedKey === "whLink" ? "Copied" : "Copy URL"}
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 text-xs text-[#8a909e] hover:text-white px-4 py-2.5 rounded-full bg-[#25272c]"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm px-8 py-3.5 transition"
              >
                Continue to launch
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: GO LIVE (60s — Preview + Shared Sender + M-Pesa Paywall) */}
        {step === 3 && currentEvent && (
          <form onSubmit={handlePayAndLaunch} className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-white">
                Preview &amp; go live.
              </h2>
              <p className="text-xs sm:text-sm text-[#8a909e] mt-1">
                Review the 5 reminders your attendees will receive, pick your
                sender, and activate with M-Pesa.
              </p>
            </div>

            {/* 5-Message Handset Carousel */}
            <div className="p-5 rounded-3xl bg-[#0b141a] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-emerald-400">
                    {activeTpl.stageLabel}
                  </span>
                  <div className="text-xs text-[#8a909e]">
                    Timing: {activeTpl.timingLabel}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIdx((i) =>
                        i === 0 ? DEFAULT_WEBINAR_TEMPLATES.length - 1 : i - 1
                      )
                    }
                    className="p-1.5 rounded-full bg-[#17191e] text-white hover:bg-[#25272c]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-white px-2">
                    {previewIdx + 1} of {DEFAULT_WEBINAR_TEMPLATES.length}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewIdx(
                        (i) => (i + 1) % DEFAULT_WEBINAR_TEMPLATES.length
                      )
                    }
                    className="p-1.5 rounded-full bg-[#17191e] text-white hover:bg-[#25272c]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#17212b] text-xs sm:text-sm text-[#e2e8f0] whitespace-pre-wrap leading-relaxed">
                {renderTemplatePreview(activeTpl.body_text, previewValues)}
              </div>
            </div>

            {/* Sender Selection: Instant Shared Number vs Own WABA Later */}
            <div className="space-y-2.5">
              <div className="text-xs text-[#9ca3af] font-medium ml-1">
                Sent from:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSenderMode("shared_showup")}
                  className={`p-4 rounded-2xl border text-left transition ${
                    senderMode === "shared_showup"
                      ? "bg-[#25272c] border-[#4589ff]"
                      : "bg-[#101114] border-white/[0.08] opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#4589ff]" />
                      ShowUp Verified Number
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium">
                      Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a909e] mt-1.5">
                    Zero Meta setup. Messages say &ldquo;Hi Wanjiku, this is the{" "}
                    {currentEvent.title.slice(0, 22)}... team via ShowUp&rdquo;.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSenderMode("own_waba");
                    if (tenant.waba_status !== "connected") {
                      onOpenEmbeddedSignup();
                    }
                  }}
                  className={`p-4 rounded-2xl border text-left transition ${
                    senderMode === "own_waba"
                      ? "bg-[#25272c] border-[#4589ff]"
                      : "bg-[#101114] border-white/[0.08] opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">
                      My own business number
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.08] text-[#9ca3af]">
                      {tenant.waba_status === "connected"
                        ? "Connected"
                        : "Free Power-Up"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8a909e] mt-1.5">
                    {tenant.waba_status === "connected"
                      ? `Sending from ${tenant.display_phone_number} (with Smart Auto-Fallback to our number while templates review).`
                      : "Connect via 1-Click Meta Embedded Signup. Auto-falls back to our verified number while Meta approves your templates."}
                  </p>
                </button>
              </div>
            </div>

            {/* Psychological No-Brainer M-Pesa Launch Box */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#25272c] border border-[#4589ff]/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm font-medium text-white">
                    {leadCount > 0
                      ? `${leadCount} leads are ready. Their welcome message sends the moment you pay.`
                      : "Your registration link & 5 reminders go live the moment you pay."}
                  </div>
                  <div className="text-xs text-[#9ca3af] mt-0.5">
                    {leadCount > 0 ? (
                      <>
                        You spent ~
                        <strong className="text-white font-mono">
                          KES {estimatedAdSpendKes.toLocaleString()}
                        </strong>{" "}
                        in ad spend/effort to get these leads. Protect that
                        investment for{" "}
                        <strong className="text-white font-mono">
                          KES {priceKes.toLocaleString()}
                        </strong>
                        .
                      </>
                    ) : (
                      "Includes up to 200 leads · 5 automated WhatsApp stages in EAT."
                    )}
                  </div>
                </div>

                {/* Tier Toggle (200 vs 500 leads) */}
                <div className="inline-flex rounded-full bg-[#17191e] p-1 border border-white/[0.06] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPassTier("event_pass")}
                    className={`px-3 py-1 rounded-full transition ${
                      passTier === "event_pass"
                        ? "bg-[#4589ff] text-white font-medium"
                        : "text-[#8a909e]"
                    }`}
                  >
                    200 leads · KES 1,500
                  </button>
                  <button
                    type="button"
                    onClick={() => setPassTier("event_scale")}
                    className={`px-3 py-1 rounded-full transition ${
                      passTier === "event_scale"
                        ? "bg-[#4589ff] text-white font-medium"
                        : "text-[#8a909e]"
                    }`}
                  >
                    500 leads · KES 3,000
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] text-[#9ca3af] mb-1 ml-3">
                    M-Pesa phone number
                  </label>
                  <input
                    type="tel"
                    required
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="w-full px-4 py-3 rounded-full bg-[#17191e] border border-white/[0.08] text-white font-mono text-sm focus:outline-none focus:border-[#4589ff]"
                  />
                </div>
                <div className="sm:col-span-7 flex items-end">
                  <button
                    type="submit"
                    disabled={paying}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm py-3.5 px-6 transition shadow-lg"
                  >
                    {paying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay KES {priceKes.toLocaleString()} with M-Pesa → Launch
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#9ca3af] pt-1">
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  100% refund if fewer than 30% of your leads show up.
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="underline hover:text-white"
                >
                  ← Back to leads
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

