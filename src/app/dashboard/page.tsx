"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Flame,
  LayoutDashboard,
  Loader2,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";
import {
  SequenceStage,
  ShowUpEvent,
  ShowUpPayment,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
  ShowUpTemplate,
  ShowUpTenant,
} from "@/lib/types";
import {
  DEFAULT_WEBINAR_TEMPLATES,
  formatEatDate,
  renderTemplatePreview,
} from "@/lib/default-templates";
import { formatPhoneDisplay } from "@/lib/phone";
import { EmbeddedSignupModal } from "@/components/whatsapp/EmbeddedSignupModal";
import { RoiReportModal } from "@/components/roi/RoiReportModal";

const STAGES_META: Array<{
  key: SequenceStage;
  step: number;
  label: string;
  timing: string;
}> = [
  { key: "instant_welcome", step: 1, label: "Instant Confirmation", timing: "Immediate (T+0s)" },
  { key: "calendar_link", step: 2, label: "Calendar Lock-In", timing: "+2 Mins After Signup" },
  { key: "t_24h", step: 3, label: "24h Value Teaser", timing: "24 Hours Before Start" },
  { key: "t_1h", step: 4, label: "1h Countdown Alert", timing: "60 Mins Before Start" },
  { key: "live_now", step: 5, label: "We Are Live + Join Link", timing: "5 Mins Before Start" },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<
    "events" | "templates" | "whatsapp" | "billing"
  >("events");
  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [tenant, setTenant] = useState<ShowUpTenant | null>(null);
  const [events, setEvents] = useState<ShowUpEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [templates, setTemplates] = useState<ShowUpTemplate[]>([]);
  const [registrants, setRegistrants] = useState<ShowUpRegistrant[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ShowUpScheduledMessage[]>([]);
  const [payments, setPayments] = useState<ShowUpPayment[]>([]);
  const [metaConfigId, setMetaConfigId] = useState("1433645942194259");
  const [metaAppId, setMetaAppId] = useState("");

  // Modals & notifications
  const [isEmbeddedModalOpen, setIsEmbeddedModalOpen] = useState(false);
  const [isRoiModalOpen, setIsRoiModalOpen] = useState(false);
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick Add Registrant state
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [addingLead, setAddingLead] = useState(false);

  // Live Test WhatsApp state
  const [testPhone, setTestPhone] = useState("0712345678");
  const [testTemplate, setTestTemplate] = useState("event_registration_confirmed");
  const [sendingTest, setSendingTest] = useState(false);

  // Dispatching stage state
  const [dispatchingStage, setDispatchingStage] = useState<string | null>(null);

  // New Event Form state
  const [newTitle, setNewTitle] = useState("");
  const [newHostName, setNewHostName] = useState("Brian");
  const [newTeaserHook, setNewTeaserHook] = useState(
    "how to build a predictable 60% webinar attendance engine in Kenya"
  );
  const [newStartsAt, setNewStartsAt] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [newJoinUrl, setNewJoinUrl] = useState("https://meet.google.com/landing");
  const [newAdSpend, setNewAdSpend] = useState(50000);
  const [newBaselinePct, setNewBaselinePct] = useState(20);
  const [newOfferPrice, setNewOfferPrice] = useState(25000);
  const [stageTplMap, setStageTplMap] = useState({
    instant_welcome: "event_registration_confirmed",
    calendar_link: "event_calendar_link",
    t_24h: "event_teaser_24h",
    t_1h: "event_starting_1h",
    live_now: "event_live_now",
  });
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Template Studio state
  const [customTplName, setCustomTplName] = useState("");
  const [customTplCategory, setCustomTplCategory] = useState<"UTILITY" | "MARKETING">(
    "UTILITY"
  );
  const [customTplStage, setCustomTplStage] = useState<SequenceStage | "custom">("t_24h");
  const [customTplBody, setCustomTplBody] = useState(
    "Hi {{1}}, quick reminder that {{2}} goes live tomorrow at {{3}} (EAT) 🎯\n\nHosted by {{4}}: {{5}}.\n\nSee you inside!"
  );
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // M-Pesa Billing state
  const [mpesaPhone, setMpesaPhone] = useState("0712345678");
  const [processingMpesa, setProcessingMpesa] = useState<string | null>(null);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setSupabaseReady(Boolean(data.supabaseReady));
      setTenant(data.tenant || null);
      setEvents(data.events || []);
      setTemplates(data.templates || []);
      setRegistrants(data.registrants || []);
      setScheduledMessages(data.scheduled_messages || []);
      setPayments(data.payments || []);
      if (data.metaConfigId) setMetaConfigId(data.metaConfigId);
      if (data.metaAppId) setMetaAppId(data.metaAppId);

      if (!selectedEventId && data.events?.length > 0) {
        setSelectedEventId(data.events[0].id);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  const showToast = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 5000);
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const activeEvent =
    events.find((e) => e.id === selectedEventId) || events[0] || null;
  const eventRegistrants = activeEvent
    ? registrants.filter((r) => r.event_id === activeEvent.id)
    : [];
  const eventMessages = activeEvent
    ? scheduledMessages.filter((m) => m.event_id === activeEvent.id)
    : [];

  // Funnel stats for active event
  const totalRegCount = eventRegistrants.length;
  const attendedCount = eventRegistrants.filter(
    (r) => r.clicked_join_link || r.zoom_verified
  ).length;
  const liveShowupPct =
    totalRegCount > 0 ? Math.round((attendedCount / totalRegCount) * 100) : 0;
  const baselinePct = activeEvent?.baseline_showup_rate || 20;

  const handleQuickAddRegistrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !quickName || !quickPhone) return;
    setAddingLead(true);
    try {
      const res = await fetch(`/api/events/${activeEvent.id}/register`, {
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
      showToast(
        `Added ${data.registrant.full_name} (+${data.registrant.phone_e164}) & fired Stage 1 Welcome!`
      );
      await loadWorkspace();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed adding lead");
    } finally {
      setAddingLead(false);
    }
  };

  const handleFireStageNow = async (stage: SequenceStage) => {
    if (!activeEvent) return;
    setDispatchingStage(stage);
    try {
      const res = await fetch("/api/jobs/dispatch-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: activeEvent.id,
          stage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      await loadWorkspace();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed firing stage");
    } finally {
      setDispatchingStage(null);
    }
  };

  const handleSampleCsvImport = async (mode: "registrants" | "attendance_reconcile") => {
    if (!activeEvent) return;
    const sampleRows =
      mode === "registrants"
        ? [
            { name: "Grace Muthoni", phone: "0721 884 920", email: "grace.m@gmail.com" },
            { name: "Samuel Kariuki", phone: "+254 710 553 190", email: "skariuki@gmail.com" },
            { name: "Esther Wambui", phone: "0110 442 819", email: "esther.w@yahoo.com" },
          ]
        : [
            { name: "Mercy Njeri", phone: "254799110505", duration: 62 },
            { name: "Brian Otieno", phone: "254701220606", duration: 58 },
          ];

    const res = await fetch(`/api/events/${activeEvent.id}/import-csv`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: sampleRows, mode }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message);
      await loadWorkspace();
    } else {
      showToast(data.error || "CSV import error");
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: testPhone,
          recipientName: "Founder",
          eventTitle: activeEvent?.title || "ShowUp Live Webinar",
          templateName: testTemplate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Test send failed");
    } finally {
      setSendingTest(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          hostName: newHostName,
          teaserHook: newTeaserHook,
          startsAt: new Date(newStartsAt).toISOString(),
          joinUrl: newJoinUrl,
          stageTemplates: stageTplMap,
          adSpendKes: newAdSpend,
          baselineShowupRate: newBaselinePct,
          offerPriceKes: newOfferPrice,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsNewEventModalOpen(false);
      setNewTitle("");
      await loadWorkspace();
      setSelectedEventId(data.event.id);
      showToast(`Created webinar "${data.event.title}"!`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Could not create event");
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleCreateCustomTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTemplate(true);
    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customTplName,
          category: customTplCategory,
          stageDefault: customTplStage,
          bodyText: customTplBody,
          exampleValues: [
            "Wanjiku",
            "Nairobi Real Estate Masterclass",
            "7:00 PM",
            "Brian",
            "how to spot high-yield plots",
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCustomTplName("");
      showToast(
        `Saved template '${data.template.name}' (${data.template.status}) and synced with Template Studio!`
      );
      await loadWorkspace();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed creating template");
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleMpesaUpgrade = async (planTier: "starter" | "pro") => {
    setProcessingMpesa(planTier);
    try {
      const res = await fetch("/api/billing/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier,
          phone: mpesaPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
      await loadWorkspace();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "M-Pesa payment failed");
    } finally {
      setProcessingMpesa(null);
    }
  };

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2 text-emerald-400" />
        Loading ShowUp Engine Command Center...
      </div>
    );
  }

  const originUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top SaaS Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight">
                  ShowUp<span className="text-emerald-400">Engine</span>
                </span>
                <span className="block text-[10px] text-slate-400">
                  {tenant.business_name}
                </span>
              </div>
            </Link>

            <span className="hidden md:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
              Plan:{" "}
              <strong className="text-emerald-400 uppercase">{tenant.plan_tier}</strong> (
              {tenant.registrants_used_this_month} / {tenant.registrant_limit} leads)
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* WABA Connection Status Button */}
            <button
              onClick={() => setIsEmbeddedModalOpen(true)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                tenant.waba_status === "connected"
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/20"
                  : "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  tenant.waba_status === "connected"
                    ? "bg-emerald-400"
                    : "bg-amber-400 animate-ping"
                }`}
              />
              {tenant.waba_status === "connected"
                ? `WABA Connected (${tenant.display_phone_number || tenant.phone_number_id})`
                : "Connect Official WhatsApp"}
            </button>

            <button
              onClick={() => setIsNewEventModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
            >
              <Plus className="w-4 h-4" />
              New Webinar
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto border-t border-slate-900">
          {[
            { id: "events", label: "Live Events & Sequence", icon: LayoutDashboard },
            { id: "templates", label: "Template Studio (Default + Custom)", icon: Sparkles },
            { id: "whatsapp", label: "Meta Embedded Signup & Webhooks", icon: Smartphone },
            { id: "billing", label: "M-Pesa Billing & Plans", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
                  isActive
                    ? "border-emerald-400 text-emerald-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast Notification Banner */}
      {bannerNotice && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/40 px-4 py-2.5 text-center text-xs text-emerald-200 font-medium">
          {bannerNotice}
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-6">
        {/* TAB 1: LIVE EVENTS & SEQUENCE COMMAND CENTER */}
        {activeTab === "events" && activeEvent && (
          <div className="space-y-6">
            {/* Top Event Switcher & Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    Active Campaign
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatEatDate(activeEvent.starts_at).fullStr}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <select
                    value={activeEvent.id}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-base sm:text-lg font-bold text-white focus:outline-none focus:border-emerald-500"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>

                  <Link
                    href={`/r/${activeEvent.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Public Registration Page (/r/{activeEvent.slug})
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() =>
                    copyText(
                      "regUrl",
                      `${originUrl}/r/${activeEvent.slug}`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200"
                >
                  {copiedKey === "regUrl" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  Copy Funnel Link
                </button>

                <button
                  onClick={() => setIsRoiModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition"
                >
                  <TrendingUp className="w-4 h-4" />
                  Generate Post-Webinar ROI Report
                </button>
              </div>
            </div>

            {/* Room Fill Progress Bar (The "Aha! Moment" Widget) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-400" />
                    Live Room Fill Rate vs. Historical Email/SMS Baseline
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tracks real-time clicks on each registrant&apos;s personalized{" "}
                    <code className="text-emerald-400">/j/[token]</code> WhatsApp join
                    button + verified Zoom/Meet CSV uploads.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-emerald-400">
                    {liveShowupPct}%
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">
                    ({attendedCount} of {totalRegCount} attended vs {baselinePct}% baseline)
                  </span>
                </div>
              </div>

              <div className="relative h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                {/* Baseline marker line */}
                <div
                  style={{ left: `${Math.min(95, baselinePct)}%` }}
                  className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                  title={`Historical Baseline: ${baselinePct}%`}
                />
                <div
                  style={{ width: `${Math.min(100, liveShowupPct)}%` }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500"
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>0%</span>
                <span className="text-red-400 font-medium">
                  ▲ Past Email/SMS Baseline ({baselinePct}%)
                </span>
                <span className="text-emerald-400 font-medium">
                  Target WhatsApp Show-Up (55%–65%)
                </span>
                <span>100%</span>
              </div>
            </div>

            {/* 5-Stage Automated Sequence Pipeline */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">
                    5-Stage Automated WhatsApp Sequence (Upstash QStash + Meta Cloud API)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Stage 1 fires on signup; Stages 2–5 fire automatically at their EAT
                    countdown timestamps—or click &ldquo;Fire Stage Now&rdquo; to trigger
                    immediately.
                  </p>
                </div>
                <span className="text-xs text-emerald-400 font-mono">
                  Timezone: Africa/Nairobi (EAT / UTC+3)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {STAGES_META.map((st) => {
                  const assignedTplName =
                    activeEvent.stage_templates?.[st.key] ||
                    DEFAULT_WEBINAR_TEMPLATES[st.step - 1].name;
                  const stageMsgs = eventMessages.filter((m) => m.stage === st.key);
                  const sentCount = stageMsgs.filter((m) =>
                    ["sent", "delivered", "read"].includes(m.status)
                  ).length;

                  return (
                    <div
                      key={st.key}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            Stage {st.step}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {sentCount}/{totalRegCount} sent
                          </span>
                        </div>
                        <div className="text-xs font-bold text-white">{st.label}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          {st.timing}
                        </div>
                        <div className="pt-1">
                          <span className="text-[10px] text-slate-500 block">
                            Active Template:
                          </span>
                          <code className="text-[11px] text-emerald-300 break-all">
                            {assignedTplName}
                          </code>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFireStageNow(st.key)}
                        disabled={dispatchingStage === st.key}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition disabled:opacity-50"
                      >
                        {dispatchingStage === st.key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        Fire Stage {st.step} Now
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lead Ingestion & Instant WhatsApp Test Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Add Lead / CSV Import / Zoom Reconcile */}
              <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    Ingest Webinar Leads (Hosted Page, CSV, or Meta Lead Ads)
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSampleCsvImport("registrants")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-slate-200"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      Import Sample Leads CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSampleCsvImport("attendance_reconcile")}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-emerald-300"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      Reconcile Zoom CSV
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleQuickAddRegistrant}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
                >
                  <input
                    type="text"
                    required
                    placeholder="Lead Full Name (e.g. Jane Wanjiru)"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="sm:col-span-5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Kenyan Phone (0712 345 678)"
                    value={quickPhone}
                    onChange={(e) => setQuickPhone(e.target.value)}
                    className="sm:col-span-4 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                  <button
                    type="submit"
                    disabled={addingLead}
                    className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition"
                  >
                    {addingLead ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Add &amp; Trigger
                  </button>
                </form>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="text-slate-400">
                    Universal Lead Webhook (Tally / Typeform / Zapier / Make):
                    <code className="ml-2 text-emerald-300">
                      POST {originUrl}/api/events/{activeEvent.id}/register
                    </code>
                  </div>
                  <button
                    onClick={() =>
                      copyText(
                        "whUrl",
                        `${originUrl}/api/events/${activeEvent.id}/register`
                      )
                    }
                    className="text-emerald-400 hover:underline font-medium shrink-0"
                  >
                    {copiedKey === "whUrl" ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>

              {/* Right: Live Handset Test Sender */}
              <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  Send Instant Test Reminder to Your Phone
                </h3>
                <p className="text-xs text-slate-400">
                  Use this during client demos: enter their Safaricom/Airtel number and let
                  them watch the template land on their phone in 2 seconds.
                </p>

                <form onSubmit={handleSendTestMessage} className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="tel"
                      required
                      placeholder="0712 345 678"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                    <select
                      value={testTemplate}
                      onChange={(e) => setTestTemplate(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      {templates.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                      <option value="hello_world">hello_world (Meta Sandbox Default)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 font-semibold text-xs transition"
                  >
                    {sendingTest ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Fire Test WhatsApp Message Now
                  </button>
                </form>
              </div>
            </div>

            {/* Registrants Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    Webinar Registrants &amp; Live Join Click Tracking ({eventRegistrants.length})
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Click any <code className="text-emerald-400">/j/token</code> link to test
                  attendance tracking
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                      <th className="py-3 px-4">Registrant</th>
                      <th className="py-3 px-4">WhatsApp (E.164)</th>
                      <th className="py-3 px-4">Source</th>
                      <th className="py-3 px-4">Tracked Join Link</th>
                      <th className="py-3 px-4">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {eventRegistrants.map((reg) => (
                      <tr key={reg.id} className="hover:bg-slate-950/40">
                        <td className="py-3 px-4 font-semibold text-white">
                          {reg.full_name}
                          {reg.email && (
                            <span className="block text-[11px] text-slate-400 font-normal">
                              {reg.email}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-200">
                          {formatPhoneDisplay(reg.phone_e164)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-[11px]">
                            {reg.source}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <a
                            href={`/j/${reg.tracking_token}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => setTimeout(loadWorkspace, 1000)}
                            className="inline-flex items-center gap-1 font-mono text-emerald-400 hover:underline"
                          >
                            /j/{reg.tracking_token}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          {reg.clicked_join_link || reg.zoom_verified ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Attended Live
                              {reg.zoom_duration_minutes
                                ? ` (${reg.zoom_duration_minutes}m)`
                                : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-[11px]">
                              Awaiting Live Join
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATE STUDIO (BOTH PRE-APPROVED DEFAULTS + CUSTOM BUILDER) */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Existing Default + Custom Templates */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">
                    WABA Message Templates ({templates.length})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Includes the 5 pre-approved ShowUp default templates + any custom
                    templates submitted for your events.
                  </p>
                </div>
                <button
                  onClick={loadWorkspace}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-emerald-400"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync from Meta WABA
                </button>
              </div>

              <div className="space-y-3">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-bold text-emerald-400">
                          {tpl.name}
                        </code>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                          {tpl.category}
                        </span>
                        {tpl.is_system_default && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            Standard Pre-Approved
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          tpl.status === "APPROVED"
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                        }`}
                      >
                        {tpl.status}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#0b141a] border border-emerald-950/60 text-xs text-slate-200 whitespace-pre-wrap font-sans">
                      {tpl.body_text}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Create Custom Template Builder */}
            <div className="lg:col-span-5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 sticky top-32">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Create Custom Event Template
                  </h3>
                  <p className="text-xs text-slate-400">
                    Write custom copy with dynamic variables (<code className="text-emerald-300">&#123;&#123;1&#125;&#125;</code> = First Name, <code className="text-emerald-300">&#123;&#123;2&#125;&#125;</code> = Event Title, <code className="text-emerald-300">&#123;&#123;3&#125;&#125;</code> = Time/Link).
                  </p>
                </div>

                <form onSubmit={handleCreateCustomTemplate} className="space-y-3.5">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Template Name (snake_case)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. forex_vip_countdown_1h"
                      value={customTplName}
                      onChange={(e) => setCustomTplName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Meta Category
                      </label>
                      <select
                        value={customTplCategory}
                        onChange={(e) =>
                          setCustomTplCategory(
                            e.target.value as "UTILITY" | "MARKETING"
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="UTILITY">UTILITY (Lower Fee)</option>
                        <option value="MARKETING">MARKETING (Promotional)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-300 mb-1">
                        Target Stage
                      </label>
                      <select
                        value={customTplStage}
                        onChange={(e) =>
                          setCustomTplStage(
                            e.target.value as SequenceStage | "custom"
                          )
                        }
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      >
                        <option value="instant_welcome">Stage 1: Instant Welcome</option>
                        <option value="calendar_link">Stage 2: Calendar Link</option>
                        <option value="t_24h">Stage 3: T-24h Teaser</option>
                        <option value="t_1h">Stage 4: T-1h Countdown</option>
                        <option value="live_now">Stage 5: Live Now Link</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Message Body
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={customTplBody}
                      onChange={(e) => setCustomTplBody(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  {/* Live Handset Bubble Preview */}
                  <div className="p-3.5 rounded-xl bg-[#0b141a] border border-emerald-950/60 space-y-1">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold">
                      Live WhatsApp Handset Preview
                    </div>
                    <div className="text-xs text-slate-200 whitespace-pre-wrap">
                      {renderTemplatePreview(customTplBody, [
                        "Wanjiku",
                        activeEvent?.title || "Masterclass",
                        "7:00 PM",
                        activeEvent?.host_name || "Brian",
                        activeEvent?.teaser_hook || "key strategies",
                      ])}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={creatingTemplate}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition"
                  >
                    {creatingTemplate ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Submit Template to Meta &amp; Save
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: META EMBEDDED SIGNUP & WEBHOOKS CONFIGURATION */}
        {activeTab === "whatsapp" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Embedded Signup Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    Meta Embedded Signup Status
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                    Config ID: {metaConfigId}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Connection State:</span>
                    <span className="font-bold text-emerald-400 uppercase">
                      {tenant.waba_status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client WABA ID:</span>
                    <code className="text-slate-200">
                      {tenant.waba_id || "Not connected yet"}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone Number ID:</span>
                    <code className="text-slate-200">
                      {tenant.phone_number_id || "Not connected yet"}
                    </code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Display Phone:</span>
                    <span className="text-slate-200 font-semibold">
                      {tenant.display_phone_number || "—"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsEmbeddedModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition"
                >
                  <Smartphone className="w-4 h-4" />
                  Open Meta Embedded Signup Modal
                </button>
              </div>

              {/* Right: Webhook & Database Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Meta Webhook &amp; Supabase Database Status
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-400">
                      Meta Webhook Callback URL (Paste in Meta Portal → WhatsApp →
                      Configuration):
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <code className="text-emerald-300 break-all">
                        {originUrl}/api/webhooks/meta
                      </code>
                      <button
                        onClick={() =>
                          copyText("metaWh", `${originUrl}/api/webhooks/meta`)
                        }
                        className="text-emerald-400 underline shrink-0"
                      >
                        {copiedKey === "metaWh" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <div className="text-slate-400">Meta Webhook Verify Token:</div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <code className="text-emerald-300">
                        showup_secret_verify_token_2026
                      </code>
                      <button
                        onClick={() =>
                          copyText("verifyTok", "showup_secret_verify_token_2026")
                        }
                        className="text-emerald-400 underline shrink-0"
                      >
                        {copiedKey === "verifyTok" ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-white font-semibold">
                        Supabase Storage Engine
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {supabaseReady
                          ? "Connected to live `showup_*` tables in Supabase"
                          : "Running on resilient local persistence (Run migration SQL in Supabase SQL Editor to sync cloud tables)"}
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        supabaseReady
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {supabaseReady ? "Cloud Active" : "Local Persistence Active"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: M-PESA BILLING & SUBSCRIPTION UPGRADE */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    M-Pesa STK Push Subscription Billing
                  </h2>
                  <p className="text-xs text-slate-400">
                    Clients pay Meta directly for their tiny Utility conversation fees, and
                    pay your monthly SaaS subscription via M-Pesa STK Push.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">M-Pesa Number:</label>
                  <input
                    type="tel"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="0712 345 678"
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-400 uppercase">
                      Free Pilot Tier
                    </div>
                    <div className="text-2xl font-extrabold text-white">Ksh 0</div>
                    <p className="text-xs text-slate-400">
                      Up to 100 registrants on your first live webinar to prove the
                      attendance jump.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-emerald-400 font-semibold">
                    {tenant.plan_tier === "pilot" ? "✓ Current Plan" : "Included"}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border-2 border-emerald-500 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-emerald-400 uppercase">
                      Starter Tier
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      Ksh 4,999 <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Up to 500 registrants/month, unlimited webinars, Template Studio, and
                      ROI reports.
                    </p>
                  </div>
                  <button
                    onClick={() => handleMpesaUpgrade("starter")}
                    disabled={processingMpesa !== null}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition"
                  >
                    {processingMpesa === "starter" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    {tenant.plan_tier === "starter"
                      ? "Renew Starter via M-Pesa"
                      : "Pay Ksh 4,999 via M-Pesa STK"}
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300 uppercase">
                      Pro Scale Tier
                    </div>
                    <div className="text-2xl font-extrabold text-white">
                      Ksh 9,999 <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Up to 2,000 registrants/month for high-volume academies and training
                      companies.
                    </p>
                  </div>
                  <button
                    onClick={() => handleMpesaUpgrade("pro")}
                    disabled={processingMpesa !== null}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-300 font-bold text-xs transition"
                  >
                    {processingMpesa === "pro" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Pay Ksh 9,999 via M-Pesa STK
                  </button>
                </div>
              </div>
            </div>

            {payments.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white">M-Pesa Receipt History</h3>
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white uppercase">
                          {p.plan_tier} Plan
                        </span>{" "}
                        • <span className="text-emerald-400 font-mono">{p.mpesa_receipt}</span>
                      </div>
                      <div className="text-slate-300">
                        Ksh {p.amount_kes.toLocaleString()} (+{p.phone_e164})
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: META EMBEDDED SIGNUP */}
      <EmbeddedSignupModal
        isOpen={isEmbeddedModalOpen}
        onClose={() => setIsEmbeddedModalOpen(false)}
        tenant={tenant}
        defaultConfigId={metaConfigId}
        defaultAppId={metaAppId}
        onConnected={(updatedTenant) => {
          setTenant(updatedTenant);
          showToast(
            `Connected Official WABA (${updatedTenant.waba_id}) & provisioned 5 Webinar Templates!`
          );
          loadWorkspace();
        }}
      />

      {/* MODAL 2: POST-WEBINAR ROI REPORT */}
      {activeEvent && (
        <RoiReportModal
          isOpen={isRoiModalOpen}
          onClose={() => setIsRoiModalOpen(false)}
          event={activeEvent}
          registrants={eventRegistrants}
          messages={eventMessages}
        />
      )}

      {/* MODAL 3: CREATE NEW WEBINAR */}
      {isNewEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white">
                Create New Webinar &amp; Configure 5-Stage Sequence
              </h3>
              <button
                onClick={() => setIsNewEventModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Webinar Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Forex & Gold Trading Masterclass"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Host / Trainer Name *</label>
                  <input
                    type="text"
                    required
                    value={newHostName}
                    onChange={(e) => setNewHostName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">
                    Start Date &amp; Time (EAT) *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newStartsAt}
                    onChange={(e) => setNewStartsAt(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">
                    Zoom / Google Meet / YouTube Live URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newJoinUrl}
                    onChange={(e) => setNewJoinUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  T-24h Value Hook (Sent 24 hours before start: &ldquo;In this session, Host
                  will show you...&rdquo;)
                </label>
                <input
                  type="text"
                  required
                  value={newTeaserHook}
                  onChange={(e) => setNewTeaserHook(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              {/* Template Assignment per Stage */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="font-semibold text-emerald-400">
                  Assign Templates for Each Stage (Default Pre-Approved or Custom):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {STAGES_META.map((st) => (
                    <div key={st.key}>
                      <label className="block text-[11px] text-slate-400 mb-0.5">
                        Stage {st.step}: {st.label}
                      </label>
                      <select
                        value={stageTplMap[st.key]}
                        onChange={(e) =>
                          setStageTplMap((prev) => ({
                            ...prev,
                            [st.key]: e.target.value,
                          }))
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      >
                        {templates.map((t) => (
                          <option key={t.id} value={t.name}>
                            {t.name} ({t.category})
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Ad Spend (Ksh)</label>
                  <input
                    type="number"
                    value={newAdSpend}
                    onChange={(e) => setNewAdSpend(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Past Baseline %</label>
                  <input
                    type="number"
                    value={newBaselinePct}
                    onChange={(e) => setNewBaselinePct(Number(e.target.value) || 20)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Offer Price (Ksh)</label>
                  <input
                    type="number"
                    value={newOfferPrice}
                    onChange={(e) => setNewOfferPrice(Number(e.target.value) || 25000)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="px-6 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold"
                >
                  {creatingEvent ? "Creating..." : "Create Webinar & Generate Funnel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

