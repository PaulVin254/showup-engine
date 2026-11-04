"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Upload,
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
import { EventSetupWizard } from "@/components/wizard/EventSetupWizard";
import { BrandRibbon, BrandWordmark } from "@/components/BrandMark";

const STAGES_META: Array<{
  key: SequenceStage;
  step: number;
  label: string;
  timing: string;
}> = [
  {
    key: "instant_welcome",
    step: 1,
    label: "Welcome message",
    timing: "Sent on signup",
  },
  {
    key: "calendar_link",
    step: 2,
    label: "Calendar lock-in",
    timing: "+2 mins after signup",
  },
  {
    key: "t_24h",
    step: 3,
    label: "24h reminder",
    timing: "24 hours before start (EAT)",
  },
  {
    key: "t_1h",
    step: 4,
    label: "1h countdown",
    timing: "60 mins before start (EAT)",
  },
  {
    key: "live_now",
    step: 5,
    label: "Join link",
    timing: "5 mins before start (EAT)",
  },
];

type TrackerViewState =
  | "zero"
  | "wizard"
  | "active"
  | "live_window"
  | "finished";

export default function DashboardPage() {
  const [topNav, setTopNav] = useState<"events" | "account">("events");
  const [trackerView, setTrackerView] = useState<TrackerViewState>("active");

  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [tenant, setTenant] = useState<ShowUpTenant | null>(null);
  const [events, setEvents] = useState<ShowUpEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [templates, setTemplates] = useState<ShowUpTemplate[]>([]);
  const [registrants, setRegistrants] = useState<ShowUpRegistrant[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<
    ShowUpScheduledMessage[]
  >([]);
  const [payments, setPayments] = useState<ShowUpPayment[]>([]);
  const [metaConfigId, setMetaConfigId] = useState("1433645942194259");
  const [metaAppId, setMetaAppId] = useState("");

  // Query param pre-fills from Homepage test flow
  const [prefillTitle, setPrefillTitle] = useState("");
  const [prefillPhone, setPrefillPhone] = useState("");
  const [wizardInitialEvent, setWizardInitialEvent] =
    useState<ShowUpEvent | null>(null);

  // Modals & UI drawers
  const [isEmbeddedModalOpen, setIsEmbeddedModalOpen] = useState(false);
  const [showLeadsDrawer, setShowLeadsDrawer] = useState(false);
  const [showAdvancedAccount, setShowAdvancedAccount] = useState(false);
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick Add Registrant state (inside collapsible drawer)
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [addingLead, setAddingLead] = useState(false);

  // Preview test message state
  const [sendingPreview, setSendingPreview] = useState(false);
  const [dispatchingStage, setDispatchingStage] = useState<string | null>(null);

  // Post-Event ROI Inline Calculator state (State C: Finished)
  const [roiAdSpend, setRoiAdSpend] = useState(12000);
  const [roiOfferPrice, setRoiOfferPrice] = useState(25000);
  const [roiCloseRate, setRoiCloseRate] = useState(6);

  // Account: Custom Template Builder (Progressive Disclosure)
  const [customTplName, setCustomTplName] = useState("");
  const [customTplCategory, setCustomTplCategory] = useState<
    "UTILITY" | "MARKETING"
  >("UTILITY");
  const [customTplStage, setCustomTplStage] = useState<
    SequenceStage | "custom"
  >("t_24h");
  const [customTplBody, setCustomTplBody] = useState(
    "Hi {{1}}, quick reminder that {{2}} goes live tomorrow at {{3}} (EAT) 🎯\n\nHosted by {{4}}: {{5}}.\n\nSee you inside!"
  );
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setSupabaseReady(Boolean(data.supabaseReady));
      setTenant(data.tenant || null);
      const loadedEvents: ShowUpEvent[] = data.events || [];
      setEvents(loadedEvents);
      setTemplates(data.templates || []);
      setRegistrants(data.registrants || []);
      setScheduledMessages(data.scheduled_messages || []);
      setPayments(data.payments || []);
      if (data.metaConfigId) setMetaConfigId(data.metaConfigId);
      if (data.metaAppId) setMetaAppId(data.metaAppId);

      if (!selectedEventId && loadedEvents.length > 0) {
        setSelectedEventId(loadedEvents[0].id);
      }
      if (loadedEvents.length === 0) {
        setTrackerView("zero");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  // Check URL params for ?setup=1&title=...&phone=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "1") {
      const t = params.get("title") || "";
      const p = params.get("phone") || "";
      if (t) setPrefillTitle(t);
      if (p) setPrefillPhone(p);
      setWizardInitialEvent(null);
      setTrackerView("wizard");
    }
  }, []);

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

  // 4 Core Numbers for the Single-Event Tracker
  const totalRegCount = eventRegistrants.length;
  const deliveredRegIds = new Set(
    eventMessages
      .filter((m) => ["sent", "delivered", "read"].includes(m.status))
      .map((m) => m.registrant_id)
  );
  const deliveredCount =
    deliveredRegIds.size > 0 ? deliveredRegIds.size : totalRegCount;
  const confirmedImInCount = Math.max(
    eventRegistrants.filter((r) => !r.opted_out && r.consent_given).length,
    0
  );
  const attendedCount = eventRegistrants.filter(
    (r) => r.clicked_join_link || r.zoom_verified
  ).length;
  const liveShowupPct =
    totalRegCount > 0 ? Math.round((attendedCount / totalRegCount) * 100) : 0;
  const baselinePct = activeEvent?.baseline_showup_rate || 18;

  const handleSendSelfPreview = async () => {
    if (!tenant) return;
    setSendingPreview(true);
    try {
      const res = await fetch("/api/whatsapp/test-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toPhone: prefillPhone || tenant.phone_e164 || "0712345678",
          recipientName: "Founder",
          eventTitle: activeEvent?.title || "Free Real Estate Masterclass",
          templateName: "event_registration_confirmed",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(data.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Preview send failed");
    } finally {
      setSendingPreview(false);
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
        `Added ${data.registrant.full_name} (+${data.registrant.phone_e164}) & sent welcome reminder!`
      );
      await loadWorkspace();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed adding person");
    } finally {
      setAddingLead(false);
    }
  };

  const handleSampleCsvImport = async (
    mode: "registrants" | "attendance_reconcile"
  ) => {
    if (!activeEvent) return;
    const sampleRows =
      mode === "registrants"
        ? [
            {
              name: "Grace Muthoni",
              phone: "0721 884 920",
              email: "grace.m@gmail.com",
            },
            {
              name: "Samuel Kariuki",
              phone: "+254 710 553 190",
              email: "skariuki@gmail.com",
            },
            {
              name: "Esther Wambui",
              phone: "0110 442 819",
              email: "esther.w@yahoo.com",
            },
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

  const handleDownloadAttendeesCsv = () => {
    if (!activeEvent) return;
    const header = "Full Name,Phone (E164),Source,Attended Live\n";
    const rows = eventRegistrants
      .map(
        (r) =>
          `"${r.full_name}",+${r.phone_e164},${r.source},${
            r.clicked_join_link || r.zoom_verified ? "YES" : "NO"
          }`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeEvent.slug}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Downloaded attendee list CSV!");
  };

  const handleDuplicateWebinar = () => {
    if (!activeEvent) return;
    setPrefillTitle(`${activeEvent.title} (Next Session)`);
    setWizardInitialEvent(null);
    setTrackerView("wizard");
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
      showToast(`Saved custom template '${data.template.name}'!`);
      await loadWorkspace();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Failed creating template"
      );
    } finally {
      setCreatingTemplate(false);
    }
  };

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-[#94a3b8]">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#4589ff]" />
        Loading ShowUp...
      </div>
    );
  }

  const originUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3005";

  // Countdown math
  const startsMs = activeEvent
    ? new Date(activeEvent.starts_at).getTime() - Date.now()
    : 0;
  const daysLeft = Math.max(0, Math.floor(startsMs / (1000 * 60 * 60 * 24)));
  const hoursLeft = Math.max(
    0,
    Math.floor((startsMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  );
  const minsLeft = Math.max(
    0,
    Math.floor((startsMs % (1000 * 60 * 60)) / (1000 * 60))
  );

  // Post-Event ROI calculations (State C)
  const baselineAttendeesCount = Math.max(
    1,
    Math.round((baselinePct / 100) * Math.max(totalRegCount, 1))
  );
  const extraAttendeesCount = Math.max(
    0,
    attendedCount - baselineAttendeesCount
  );
  const costPerAttendeeKes =
    attendedCount > 0 ? Math.round(roiAdSpend / attendedCount) : roiAdSpend;
  const costPerAttendeeBeforeKes = Math.round(
    roiAdSpend / baselineAttendeesCount
  );
  const extraRevenueKes = Math.round(
    extraAttendeesCount * (roiCloseRate / 100) * roiOfferPrice
  );

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col">
      {/* Minimal Top Navigation: Brand · Events · Account */}
      <header className="sticky top-0 z-30 w-full px-6 sm:px-10 py-4 bg-canvas/90 backdrop-blur-md border-b border-white/[0.06]">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" aria-label="ShowUp Home">
            <BrandWordmark />
          </Link>

          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 rounded-full bg-[#17191e] border border-white/[0.06]">
              <button
                type="button"
                onClick={() => setTopNav("events")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  topNav === "events"
                    ? "bg-[#25272c] text-white"
                    : "text-[#8a909e] hover:text-white"
                }`}
              >
                Events
              </button>
              <button
                type="button"
                onClick={() => setTopNav("account")}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition ${
                  topNav === "account"
                    ? "bg-[#25272c] text-white"
                    : "text-[#8a909e] hover:text-white"
                }`}
              >
                Account
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setTopNav("events");
                setWizardInitialEvent(null);
                setPrefillTitle("");
                setTrackerView("wizard");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-white bg-[#4589ff] hover:bg-[#5896ff] transition"
            >
              <Plus className="w-3.5 h-3.5" />
              New webinar
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {bannerNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-5 py-3 rounded-full bg-[#25272c] border border-white/[0.12] shadow-2xl text-xs text-white font-medium">
          {bannerNotice}
        </div>
      )}

      {/* MAIN SINGLE-TRACK CONTAINER */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 space-y-6">
        {topNav === "events" && (
          <>
            {/* Subtle Lifecycle State Bar (Lets host / reviewer switch between the 3 core states + Setup Wizard effortlessly) */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                {events.length > 1 && trackerView !== "zero" && (
                  <select
                    value={activeEvent?.id || ""}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="bg-[#17191e] border border-white/[0.08] rounded-full px-3.5 py-1.5 text-xs font-medium text-white focus:outline-none focus:border-[#4589ff]"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                      </option>
                    ))}
                  </select>
                )}
                <span className="text-[11px] text-[#8a909e]">
                  Tracker state preview:
                </span>
              </div>

              <div className="inline-flex flex-wrap gap-1 p-1 rounded-full bg-[#17191e] border border-white/[0.06] text-[11px]">
                {[
                  { id: "zero", label: "State A: 0 Events" },
                  { id: "wizard", label: "3-Step Setup" },
                  { id: "active", label: "State B: Counting Down" },
                  { id: "live_window", label: "🔴 Live Window" },
                  { id: "finished", label: "State C: Finished + ROI" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTrackerView(s.id as TrackerViewState)}
                    className={`px-3 py-1 rounded-full transition ${
                      trackerView === s.id
                        ? "bg-[#25272c] text-white font-medium"
                        : "text-[#8a909e] hover:text-white"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* STATE A: 0 EVENTS (Clean Empty State)                     */}
            {/* ========================================================= */}
            {trackerView === "zero" && (
              <div className="py-12">
                <div className="max-w-lg mx-auto bg-[#17191e] border border-white/[0.08] rounded-3xl p-8 sm:p-10 text-center space-y-6">
                  <div className="flex justify-center">
                    <BrandRibbon className="w-16 h-14" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-white">
                      Fill your next live room on WhatsApp.
                    </h1>
                    <p className="text-xs sm:text-sm text-[#8a909e] leading-relaxed">
                      Set up your webinar in 3 minutes. Share your registration
                      link or paste your leads, and let ShowUp run the 5-stage
                      countdown automatically.
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWizardInitialEvent(null);
                        setTrackerView("wizard");
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm py-4 px-6 transition"
                    >
                      Create your first webinar
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      disabled={sendingPreview}
                      onClick={handleSendSelfPreview}
                      className="text-xs text-[#9ca3af] hover:text-white underline underline-offset-4 transition inline-flex items-center gap-1.5"
                    >
                      {sendingPreview && (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      )}
                      Send me a test WhatsApp message first
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 3-STEP GUIDED EVENT SETUP WIZARD                          */}
            {/* ========================================================= */}
            {trackerView === "wizard" && (
              <EventSetupWizard
                tenant={tenant}
                initialEvent={wizardInitialEvent}
                initialTitle={prefillTitle}
                initialPhone={prefillPhone}
                eventRegistrants={
                  wizardInitialEvent
                    ? registrants.filter(
                        (r) => r.event_id === wizardInitialEvent.id
                      )
                    : eventRegistrants
                }
                originUrl={originUrl}
                onCancel={
                  events.length > 0 ? () => setTrackerView("active") : undefined
                }
                onEventSaved={async (savedEv) => {
                  setWizardInitialEvent(savedEv);
                  setSelectedEventId(savedEv.id);
                  await loadWorkspace();
                }}
                onLaunched={async (launchedId, msg) => {
                  setSelectedEventId(launchedId);
                  await loadWorkspace();
                  setTrackerView("active");
                  showToast(msg);
                }}
                onOpenEmbeddedSignup={() => setIsEmbeddedModalOpen(true)}
                onToast={showToast}
              />
            )}

            {/* ========================================================= */}
            {/* STATE B: ACTIVE EVENT (Counting Down or Live Window)      */}
            {/* ========================================================= */}
            {(trackerView === "active" || trackerView === "live_window") &&
              activeEvent && (
                <div className="space-y-6">
                  {/* Hero Tracker Card */}
                  <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <h1 className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] text-white">
                          {activeEvent.title}
                        </h1>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#9ca3af] font-mono">
                          <span>
                            {formatEatDate(activeEvent.starts_at).fullStr}
                          </span>
                          <span>·</span>
                          <a
                            href={activeEvent.join_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#4589ff] hover:underline truncate max-w-[260px]"
                          >
                            {activeEvent.join_url.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      </div>

                      {/* Countdown or LIVE badge */}
                      {trackerView === "live_window" ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-semibold animate-pulse">
                          🔴 LIVE: {attendedCount} people joined from WhatsApp
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25272c] border border-white/[0.08] text-xs font-mono text-white shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#4589ff]" />
                          Starts in {daysLeft}d {hoursLeft}h {minsLeft}m
                        </div>
                      )}
                    </div>

                    {/* Single 3-Step Progress Bar: Setup ✓ -> Leads added ✓ -> Reminders running */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="h-1.5 rounded-full bg-[#4589ff]" />
                        <div
                          className={`h-1.5 rounded-full ${
                            totalRegCount > 0 ? "bg-[#4589ff]" : "bg-[#25272c]"
                          }`}
                        />
                        <div
                          className={`h-1.5 rounded-full ${
                            activeEvent.is_paid !== false
                              ? "bg-emerald-400"
                              : "bg-amber-400"
                          }`}
                        />
                      </div>
                      <div className="grid grid-cols-3 text-[11px] font-medium text-[#9ca3af]">
                        <span className="text-white">✓ Setup complete</span>
                        <span className={totalRegCount > 0 ? "text-white" : ""}>
                          {totalRegCount > 0
                            ? `✓ Leads added (${totalRegCount})`
                            : "○ Add leads"}
                        </span>
                        <span
                          className={
                            activeEvent.is_paid !== false
                              ? "text-emerald-400"
                              : "text-amber-300"
                          }
                        >
                          {activeEvent.is_paid !== false
                            ? "● Reminders running"
                            : "⏳ Ready to launch (Unpaid)"}
                        </span>
                      </div>
                    </div>

                    {/* The 4 Core Numbers */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        {
                          value: totalRegCount,
                          label: "registered",
                          highlight: false,
                        },
                        {
                          value: deliveredCount,
                          label: "delivered",
                          highlight: false,
                        },
                        {
                          value: confirmedImInCount,
                          label: '"I\'m in"',
                          highlight: false,
                        },
                        {
                          value:
                            trackerView === "live_window" || attendedCount > 0
                              ? attendedCount
                              : "—",
                          label: "joined live",
                          highlight: trackerView === "live_window",
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className={`p-4 rounded-2xl border text-center ${
                            stat.highlight
                              ? "bg-[#4589ff]/15 border-[#4589ff]/40"
                              : "bg-[#25272c]/70 border-white/[0.06]"
                          }`}
                        >
                          <div className="font-mono tracking-tight text-2xl sm:text-3xl font-medium text-white">
                            {stat.value}
                          </div>
                          <div className="text-xs text-[#9ca3af] mt-1">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Single 👉 NEXT Action Card (Always One Clear Action) */}
                    {activeEvent.is_paid === false ? (
                      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm font-medium text-white">
                            👉 NEXT: Activate your 5-stage WhatsApp reminders
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            {totalRegCount} leads are loaded. Pay KES 1,500 via
                            M-Pesa to start their automated sequence.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setWizardInitialEvent(activeEvent);
                            setTrackerView("wizard");
                          }}
                          className="px-5 py-2.5 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-xs font-medium text-white shrink-0 transition"
                        >
                          Pay KES 1,500 &amp; Launch →
                        </button>
                      </div>
                    ) : trackerView === "live_window" ? (
                      <div className="p-5 rounded-2xl bg-[#4589ff]/15 border border-[#4589ff]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm font-medium text-white">
                            🔴 Your room is live! Stage 5 join links have been
                            dispatched.
                          </div>
                          <div className="text-xs text-[#9ca3af]">
                            When your webinar ends, view your attendance lift
                            and ROI report.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTrackerView("finished")}
                          className="px-5 py-2.5 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-xs font-medium text-white shrink-0 transition"
                        >
                          Complete &amp; View Results →
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-[#25272c] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm font-medium text-white">
                            👉 NEXT: Share your page to get more registrations
                          </div>
                          <div className="text-xs font-mono text-[#4589ff]">
                            {originUrl}/r/{activeEvent.slug}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              copyText(
                                "nextRegUrl",
                                `${originUrl}/r/${activeEvent.slug}`
                              )
                            }
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-xs font-medium text-white transition"
                          >
                            {copiedKey === "nextRegUrl" ? (
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
                          <button
                            type="button"
                            onClick={() => {
                              setWizardInitialEvent(activeEvent);
                              setTrackerView("wizard");
                            }}
                            className="px-4 py-2.5 rounded-full bg-[#17191e] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-white transition"
                          >
                            + Add list
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Clean 5-Stage Vertical Timeline */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-medium text-white">
                          5-Stage WhatsApp Timeline
                        </h2>
                        <span className="text-[11px] font-mono text-[#8a909e]">
                          East Africa Time (EAT)
                        </span>
                      </div>

                      <div className="divide-y divide-white/[0.06] rounded-2xl bg-[#101114] border border-white/[0.06] overflow-hidden">
                        {STAGES_META.map((st) => {
                          const stageMsgs = eventMessages.filter(
                            (m) => m.stage === st.key
                          );
                          const sentCount = stageMsgs.filter((m) =>
                            ["sent", "delivered", "read"].includes(m.status)
                          ).length;

                          const isDone =
                            st.step <= 2 ||
                            sentCount > 0 ||
                            (trackerView === "live_window" && st.step <= 5);
                          const isNext = !isDone && st.step === 3;

                          return (
                            <div
                              key={st.key}
                              className="px-4 py-3.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] ${
                                    isDone
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : isNext
                                      ? "bg-[#4589ff]/20 text-[#4589ff]"
                                      : "bg-[#25272c] text-[#8a909e]"
                                  }`}
                                >
                                  {isDone ? "✓" : isNext ? "⏳" : "○"}
                                </span>
                                <div>
                                  <span className="font-medium text-white">
                                    {st.label}
                                  </span>
                                  <span className="text-[#8a909e] ml-2">
                                    · {st.timing}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className="text-[11px] font-mono text-[#8a909e]">
                                  {isDone
                                    ? `${Math.max(sentCount, totalRegCount)} sent`
                                    : "Scheduled"}
                                </span>
                                <button
                                  type="button"
                                  disabled={dispatchingStage === st.key}
                                  onClick={() => handleFireStageNow(st.key)}
                                  className="text-[11px] text-[#4589ff] hover:underline inline-flex items-center gap-1"
                                  title="Trigger this stage immediately for demo/testing"
                                >
                                  {dispatchingStage === st.key ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Play className="w-3 h-3" />
                                  )}
                                  Send now
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Actions of Tracker Card */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setShowLeadsDrawer((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition"
                      >
                        <Users className="w-3.5 h-3.5 text-[#4589ff]" />
                        {showLeadsDrawer
                          ? "Hide registrants list"
                          : `View or add registrants (${totalRegCount})`}
                        {showLeadsDrawer ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        disabled={sendingPreview}
                        onClick={handleSendSelfPreview}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-xs font-medium text-white transition"
                      >
                        {sendingPreview ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 text-[#4589ff]" />
                        )}
                        Send myself a preview
                      </button>
                    </div>
                  </div>

                  {/* Collapsible Registrants & Quick Add Drawer (Progressive Disclosure) */}
                  {showLeadsDrawer && (
                    <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-medium text-white">
                          Registrants ({totalRegCount})
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSampleCsvImport("registrants")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25272c] text-xs text-white"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#4589ff]" />
                            Load sample CSV
                          </button>
                          <button
                            type="button"
                            onClick={handleDownloadAttendeesCsv}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25272c] text-xs text-white"
                          >
                            <Download className="w-3.5 h-3.5 text-[#4589ff]" />
                            Export CSV
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
                          placeholder="Full Name (e.g. Jane Wanjiru)"
                          value={quickName}
                          onChange={(e) => setQuickName(e.target.value)}
                          className="sm:col-span-5 px-4 py-2.5 rounded-full bg-[#25272c] border border-white/[0.08] text-xs text-white"
                        />
                        <input
                          type="tel"
                          required
                          placeholder="0712 345 678"
                          value={quickPhone}
                          onChange={(e) => setQuickPhone(e.target.value)}
                          className="sm:col-span-4 px-4 py-2.5 rounded-full bg-[#25272c] border border-white/[0.08] text-xs text-white font-mono"
                        />
                        <button
                          type="submit"
                          disabled={addingLead}
                          className="sm:col-span-3 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-xs"
                        >
                          {addingLead ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Plus className="w-3.5 h-3.5" />
                          )}
                          Add person
                        </button>
                      </form>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-white/[0.08] text-[#8a909e]">
                              <th className="py-2.5 px-3">Name</th>
                              <th className="py-2.5 px-3">WhatsApp</th>
                              <th className="py-2.5 px-3">Personal Join Link</th>
                              <th className="py-2.5 px-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.06]">
                            {eventRegistrants.map((reg) => (
                              <tr key={reg.id}>
                                <td className="py-2.5 px-3 font-medium text-white">
                                  {reg.full_name}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[#9ca3af]">
                                  {formatPhoneDisplay(reg.phone_e164)}
                                </td>
                                <td className="py-2.5 px-3">
                                  <a
                                    href={`/j/${reg.tracking_token}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={() =>
                                      setTimeout(loadWorkspace, 1000)
                                    }
                                    className="font-mono text-[#4589ff] hover:underline inline-flex items-center gap-1"
                                  >
                                    /j/{reg.tracking_token}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </td>
                                <td className="py-2.5 px-3">
                                  {reg.clicked_join_link || reg.zoom_verified ? (
                                    <span className="text-emerald-400 font-medium">
                                      ✓ Joined live
                                    </span>
                                  ) : (
                                    <span className="text-[#8a909e]">
                                      Reminded
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

            {/* ========================================================= */}
            {/* STATE C: FINISHED EVENT (Results + Post-Event ROI Card)   */}
            {/* ========================================================= */}
            {trackerView === "finished" && activeEvent && (
              <div className="space-y-6">
                <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 sm:p-9 space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-medium">
                      ✓ Webinar Completed
                    </span>
                    <span className="text-xs font-mono text-[#8a909e]">
                      {formatEatDate(activeEvent.starts_at).fullStr}
                    </span>
                  </div>

                  {/* Result Headline */}
                  <div className="space-y-2">
                    <div className="text-xs text-[#9ca3af]">
                      {activeEvent.title}
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-medium tracking-[-0.035em] text-white">
                      {totalRegCount} registered → {attendedCount} showed up (
                      <span className="text-[#4589ff]">{liveShowupPct}%</span>)
                    </h1>
                    <p className="text-sm sm:text-base text-[#9ca3af]">
                      Industry email/SMS average in Kenya is 15–20%.{" "}
                      <strong className="text-white">
                        That&apos;s +{extraAttendeesCount} extra attendees you
                        wouldn&apos;t have had in your room.
                      </strong>
                    </p>
                  </div>

                  {/* Two Primary Post-Event CTAs */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleDuplicateWebinar}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm px-7 py-3.5 transition"
                    >
                      Run another webinar (duplicate this one)
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadAttendeesCsv}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-white font-medium text-sm px-6 py-3.5 transition"
                    >
                      <Download className="w-4 h-4 text-[#4589ff]" />
                      Download attendee list
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSampleCsvImport("attendance_reconcile")
                      }
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#101114] border border-white/[0.08] hover:bg-[#25272c] text-xs text-[#9ca3af] hover:text-white px-4 py-3.5 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#4589ff]" />
                      Reconcile Zoom CSV
                    </button>
                  </div>

                  {/* Embedded Post-Event ROI Calculator (Fed by real attendance data) */}
                  <div className="pt-6 border-t border-white/[0.08] space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-medium text-white flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-[#4589ff]" />
                          Your Real Webinar ROI Breakdown
                        </h2>
                        <p className="text-xs text-[#8a909e]">
                          Calculated from your {attendedCount} verified live
                          attendees vs {baselinePct}% email baseline.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-[#25272c] border border-white/[0.06]">
                        <div className="text-xs text-[#8a909e]">
                          Cost per live attendee
                        </div>
                        <div className="font-mono text-2xl font-medium text-white mt-1">
                          KES {costPerAttendeeKes.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[#8a909e] mt-1">
                          Down from{" "}
                          <span className="line-through text-red-400">
                            KES {costPerAttendeeBeforeKes.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#25272c] border border-white/[0.06]">
                        <div className="text-xs text-[#8a909e]">
                          Extra people in the room
                        </div>
                        <div className="font-mono text-2xl font-medium text-emerald-400 mt-1">
                          +{extraAttendeesCount} attendees
                        </div>
                        <div className="text-[11px] text-[#8a909e] mt-1">
                          vs {baselineAttendeesCount} with email/SMS
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[#4589ff]/15 border border-[#4589ff]/40">
                        <div className="text-xs text-[#7db4ff]">
                          Estimated extra sales
                        </div>
                        <div className="font-mono text-2xl font-medium text-white mt-1">
                          +KES {extraRevenueKes.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-[#9ca3af] mt-1">
                          From KES 1,500 ShowUp pass
                        </div>
                      </div>
                    </div>

                    {/* Adjustable inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] text-[#8a909e] mb-1 ml-3">
                          Your ad spend (KES)
                        </label>
                        <input
                          type="number"
                          value={roiAdSpend}
                          onChange={(e) =>
                            setRoiAdSpend(Number(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2.5 rounded-full bg-[#101114] border border-white/[0.08] text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8a909e] mb-1 ml-3">
                          Your offer price (KES)
                        </label>
                        <input
                          type="number"
                          value={roiOfferPrice}
                          onChange={(e) =>
                            setRoiOfferPrice(Number(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2.5 rounded-full bg-[#101114] border border-white/[0.08] text-xs font-mono text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#8a909e] mb-1 ml-3">
                          Close rate (%)
                        </label>
                        <input
                          type="number"
                          value={roiCloseRate}
                          onChange={(e) =>
                            setRoiCloseRate(Number(e.target.value) || 5)
                          }
                          className="w-full px-4 py-2.5 rounded-full bg-[#101114] border border-white/[0.08] text-xs font-mono text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ========================================================= */}
        {/* ACCOUNT VIEW (Deferred Plumbing & Progressive Disclosure) */}
        {/* ========================================================= */}
        {topNav === "account" && (
          <div className="space-y-6">
            {/* 1. Custom Brand Sender Upgrade (Own WABA) */}
            <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-[#4589ff] font-medium">
                    Sender Identity
                  </span>
                  <h2 className="text-xl font-medium text-white mt-0.5">
                    Send reminders from your own business number
                  </h2>
                  <p className="text-xs text-[#8a909e] mt-1">
                    By default, ShowUp sends instantly from our verified number.
                    Connect your own WhatsApp Business Account anytime so
                    messages come directly from your brand.
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    tenant.waba_status === "connected"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-[#25272c] text-[#9ca3af]"
                  }`}
                >
                  {tenant.waba_status === "connected"
                    ? `Connected (${tenant.display_phone_number || tenant.phone_number_id})`
                    : "Using ShowUp Shared Number"}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsEmbeddedModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#25272c] hover:bg-[#2f3238] text-xs font-medium text-white transition"
                >
                  <Smartphone className="w-4 h-4 text-[#4589ff]" />
                  {tenant.waba_status === "connected"
                    ? "Manage Official WhatsApp Connection"
                    : "Connect My Own Business Number (Meta Embedded Signup)"}
                </button>
              </div>
            </div>

            {/* 2. M-Pesa Payment Receipts */}
            <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4">
              <h2 className="text-lg font-medium text-white">
                M-Pesa Receipts &amp; Event Passes
              </h2>
              {payments.length === 0 ? (
                <p className="text-xs text-[#8a909e]">
                  No M-Pesa payments yet. You only pay when you launch a
                  webinar.
                </p>
              ) : (
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-[#101114] border border-white/[0.06] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-white uppercase">
                          {p.plan_tier.replace("_", " ")}
                        </span>{" "}
                        ·{" "}
                        <span className="font-mono text-[#4589ff]">
                          {p.mpesa_receipt}
                        </span>
                      </div>
                      <div className="font-mono text-[#9ca3af]">
                        KES {p.amount_kes.toLocaleString()} (+{p.phone_e164})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Progressive Disclosure: Advanced Templates & Webhooks */}
            <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl p-6 sm:p-8 space-y-4">
              <button
                type="button"
                onClick={() => setShowAdvancedAccount((v) => !v)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <h2 className="text-base font-medium text-white">
                    Advanced: Customize Message Templates &amp; Webhooks
                  </h2>
                  <p className="text-xs text-[#8a909e]">
                    Optional tools for power hosts running custom Meta templates
                    or external webhooks.
                  </p>
                </div>
                {showAdvancedAccount ? (
                  <ChevronUp className="w-4 h-4 text-[#8a909e]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#8a909e]" />
                )}
              </button>

              {showAdvancedAccount && (
                <div className="pt-4 border-t border-white/[0.08] space-y-6">
                  {/* Webhook & DB Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.06] space-y-1">
                      <div className="text-[#8a909e]">Meta Webhook URL</div>
                      <div className="flex items-center justify-between gap-2">
                        <code className="text-[#4589ff] truncate">
                          {originUrl}/api/webhooks/meta
                        </code>
                        <button
                          type="button"
                          onClick={() =>
                            copyText("whMeta", `${originUrl}/api/webhooks/meta`)
                          }
                          className="text-white underline"
                        >
                          {copiedKey === "whMeta" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#101114] border border-white/[0.06] flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-[#4589ff]" />
                          Persistence Engine
                        </div>
                        <div className="text-[11px] text-[#8a909e]">
                          {supabaseReady
                            ? "Supabase Cloud Connected"
                            : "Local JSON Persistence Active"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={loadWorkspace}
                        className="p-2 rounded-full bg-[#25272c] text-white"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Custom Template Form */}
                  <form
                    onSubmit={handleCreateCustomTemplate}
                    className="p-5 rounded-2xl bg-[#101114] border border-white/[0.06] space-y-3 text-xs"
                  >
                    <div className="font-medium text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#4589ff]" />
                      Create Custom Meta Template ({templates.length} active)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        required
                        placeholder="template_name_snake_case"
                        value={customTplName}
                        onChange={(e) => setCustomTplName(e.target.value)}
                        className="px-3.5 py-2 rounded-full bg-[#17191e] border border-white/[0.08] text-white font-mono"
                      />
                      <select
                        value={customTplCategory}
                        onChange={(e) =>
                          setCustomTplCategory(
                            e.target.value as "UTILITY" | "MARKETING"
                          )
                        }
                        className="px-3.5 py-2 rounded-full bg-[#17191e] border border-white/[0.08] text-white"
                      >
                        <option value="UTILITY">UTILITY</option>
                        <option value="MARKETING">MARKETING</option>
                      </select>
                      <select
                        value={customTplStage}
                        onChange={(e) =>
                          setCustomTplStage(
                            e.target.value as SequenceStage | "custom"
                          )
                        }
                        className="px-3.5 py-2 rounded-full bg-[#17191e] border border-white/[0.08] text-white"
                      >
                        <option value="instant_welcome">Stage 1: Welcome</option>
                        <option value="calendar_link">Stage 2: Calendar</option>
                        <option value="t_24h">Stage 3: 24h Reminder</option>
                        <option value="t_1h">Stage 4: 1h Countdown</option>
                        <option value="live_now">Stage 5: Live Link</option>
                      </select>
                    </div>
                    <textarea
                      rows={3}
                      value={customTplBody}
                      onChange={(e) => setCustomTplBody(e.target.value)}
                      className="w-full p-3.5 rounded-2xl bg-[#17191e] border border-white/[0.08] text-white"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#8a909e]">
                        Preview:{" "}
                        {renderTemplatePreview(customTplBody, [
                          "Wanjiku",
                          activeEvent?.title || "Masterclass",
                          "7:00 PM",
                          "Brian",
                          "key strategies",
                        ]).slice(0, 60)}
                        ...
                      </span>
                      <button
                        type="submit"
                        disabled={creatingTemplate}
                        className="px-4 py-2 rounded-full bg-[#4589ff] text-white font-medium"
                      >
                        {creatingTemplate ? "Saving..." : "Save Template"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* META EMBEDDED SIGNUP MODAL (Only opened when host chooses to connect their own business number) */}
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
    </div>
  );
}
