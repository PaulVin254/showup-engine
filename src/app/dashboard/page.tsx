"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Smartphone } from "lucide-react";
import {
  SequenceStage,
  ShowUpEvent,
  ShowUpPayment,
  ShowUpRegistrant,
  ShowUpScheduledMessage,
  ShowUpTemplate,
  ShowUpTenant,
} from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/phone";
import { csvToLeadRows } from "@/lib/csv";
import { deriveLifecycle, fmtEat } from "@/lib/lifecycle";
import { useNow } from "@/lib/use-now";
import { stageTemplate } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { EmbeddedSignupModal } from "@/components/whatsapp/EmbeddedSignupModal";
import { EventSetupWizard } from "@/components/wizard/EventSetupWizard";
import { HostAuthModal } from "@/components/auth/HostAuthModal";
import { RoiReportModal } from "@/components/roi/RoiReportModal";
import { CommandCenter } from "@/components/dashboard/CommandCenter";
import { FinishedReport } from "@/components/dashboard/FinishedReport";
import { ZeroState } from "@/components/dashboard/ZeroState";
import { RegistrantsSheet } from "@/components/dashboard/RegistrantsSheet";
import { SettingsView } from "@/components/dashboard/SettingsView";
import { BrandWordmark } from "@/components/BrandMark";
import { Button, EASE_OUT_FAST, SPRING_SNAPPY, ToastItem, ToastStack } from "@/components/ui/kit";

const DEV_MODE_KEY = "showup_dev_mode";

export default function DashboardPage() {
  const now = useNow(1000);
  const [view, setView] = useState<"events" | "settings">("events");

  const [loading, setLoading] = useState(true);
  const [supabaseReady, setSupabaseReady] = useState(false);
  const [tenant, setTenant] = useState<ShowUpTenant | null>(null);
  const [events, setEvents] = useState<ShowUpEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [templates, setTemplates] = useState<ShowUpTemplate[]>([]);
  const [registrants, setRegistrants] = useState<ShowUpRegistrant[]>([]);
  const [scheduledMessages, setScheduledMessages] = useState<ShowUpScheduledMessage[]>([]);
  const [payments, setPayments] = useState<ShowUpPayment[]>([]);
  const [metaConfigId, setMetaConfigId] = useState("1433645942194259");
  const [metaAppId, setMetaAppId] = useState("");

  // Wizard + prefill (from landing-page test flow)
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardEvent, setWizardEvent] = useState<ShowUpEvent | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [prefillTitle, setPrefillTitle] = useState("");
  const [prefillPhone, setPrefillPhone] = useState("");

  // Overlays
  const [embeddedOpen, setEmbeddedOpen] = useState(false);
  const [hostAuthOpen, setHostAuthOpen] = useState(false);
  const [registrantsOpen, setRegistrantsOpen] = useState(false);
  const [roiOpen, setRoiOpen] = useState(false);
  const [devMode, setDevMode] = useState(false);

  // Async action state
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [addingLead, setAddingLead] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [dispatchingStage, setDispatchingStage] = useState<string | null>(null);

  const showToast = useCallback((message: string, tone?: ToastItem["tone"]) => {
    const id = Date.now() + Math.random();
    const inferred: ToastItem["tone"] =
      tone ||
      (/fail|error|could not|invalid|missing|not a valid/i.test(message) ? "error" : "success");
    setToasts((t) => [...t.slice(-3), { id, message, tone: inferred }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  const loadWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setSupabaseReady(Boolean(data.supabaseReady));
      setTenant(data.tenant || null);
      const loaded: ShowUpEvent[] = data.events || [];
      setEvents(loaded);
      setTemplates(data.templates || []);
      setRegistrants(data.registrants || []);
      setScheduledMessages(data.scheduled_messages || []);
      setPayments(data.payments || []);
      if (data.metaConfigId) setMetaConfigId(data.metaConfigId);
      if (data.metaAppId) setMetaAppId(data.metaAppId);
      setSelectedEventId((prev) =>
        prev && loaded.some((e) => e.id === prev) ? prev : loaded[0]?.id || ""
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    setDevMode(localStorage.getItem(DEV_MODE_KEY) === "1");
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "1") {
      setPrefillTitle(params.get("title") || "");
      setPrefillPhone(params.get("phone") || "");
      setWizardEvent(null);
      setWizardStep(1);
      setWizardOpen(true);
    }
  }, []);

  const updateDevMode = (v: boolean) => {
    setDevMode(v);
    localStorage.setItem(DEV_MODE_KEY, v ? "1" : "0");
  };

  const activeEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;
  const lifecycle = deriveLifecycle(activeEvent, now);
  const eventRegistrants = activeEvent
    ? registrants.filter((r) => r.event_id === activeEvent.id)
    : [];
  const eventMessages = activeEvent
    ? scheduledMessages.filter((m) => m.event_id === activeEvent.id)
    : [];

  // Live data: poll faster while the room is open.
  useEffect(() => {
    if (!activeEvent) return;
    const id = setInterval(loadWorkspace, lifecycle === "live" ? 10_000 : 30_000);
    return () => clearInterval(id);
  }, [lifecycle, activeEvent, loadWorkspace]);

  const openWizard = (
    opts: { event?: ShowUpEvent | null; step?: 1 | 2 | 3; title?: string } = {}
  ) => {
    setWizardEvent(opts.event ?? null);
    setWizardStep(opts.step ?? 1);
    setPrefillTitle(opts.title ?? "");
    setWizardOpen(true);
  };

  /* ----------------------------- handlers ----------------------------- */
  const postJson = async (url: string, body: unknown) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const handleSendTest = async (stage: SequenceStage) => {
    const to = tenant?.phone_e164 || prefillPhone;
    if (!to) {
      showToast("Sign in with your WhatsApp number to receive test messages", "info");
      setHostAuthOpen(true);
      return;
    }
    setSendingTest(true);
    try {
      const data = await postJson("/api/whatsapp/test-send", {
        toPhone: to,
        recipientName: "Founder",
        eventTitle: activeEvent?.title || "Webinar",
        templateName: stageTemplate(stage).name,
      });
      showToast(data.message || `Test sent to ${formatPhoneDisplay(to)}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Test send failed");
    } finally {
      setSendingTest(false);
    }
  };

  const handleFireStage = async (stage: SequenceStage) => {
    if (!activeEvent) return;
    setDispatchingStage(stage);
    try {
      const data = await postJson("/api/jobs/dispatch-message", {
        eventId: activeEvent.id,
        stage,
      });
      showToast(data.message || "Stage dispatched");
      await loadWorkspace();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to dispatch stage");
    } finally {
      setDispatchingStage(null);
    }
  };

  const handleAddRegistrant = async (fullName: string, phone: string) => {
    if (!activeEvent) return false;
    setAddingLead(true);
    try {
      const data = await postJson(`/api/events/${activeEvent.id}/register`, {
        fullName,
        phone,
        source: "manual_test",
      });
      showToast(`Added ${data.registrant.full_name} · +${data.registrant.phone_e164}`);
      await loadWorkspace();
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not add registrant");
      return false;
    } finally {
      setAddingLead(false);
    }
  };

  const handleCsvFile = async (file: File, mode: "registrants" | "attendance_reconcile") => {
    if (!activeEvent) return;
    try {
      const rows = csvToLeadRows(await file.text());
      if (rows.length === 0) throw new Error("No rows found. Expected columns: name, phone");
      const data = await postJson(`/api/events/${activeEvent.id}/import-csv`, { rows, mode });
      showToast(data.message || `Imported ${rows.length} rows`);
      await loadWorkspace();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "CSV import failed");
    }
  };

  const handleExportCsv = () => {
    if (!activeEvent) return;
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const header = "Full Name,Phone (E164),Source,Attended Live,Joined At (EAT),Zoom Minutes\n";
    const rows = eventRegistrants
      .map((r) =>
        [
          esc(r.full_name),
          `+${r.phone_e164}`,
          r.source,
          r.clicked_join_link || r.zoom_verified ? "YES" : "NO",
          r.joined_at ? fmtEat(r.joined_at, { date: true }) : "",
          r.zoom_duration_minutes ?? "",
        ].join(",")
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeEvent.slug}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${eventRegistrants.length} registrants`);
  };

  const originUrl =
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3005";

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center text-slate-500 text-[13px]">
        <Loader2 className="w-4 h-4 animate-spin mr-2 text-[#1877f2]" />
        Loading workspace
      </div>
    );
  }

  const signedIn = tenant.id !== "guest" && Boolean(tenant.phone_e164);
  const panelKey =
    view === "settings" ? "settings" : `${lifecycle}-${activeEvent?.id || "none"}`;

  return (
    <div className="min-h-screen bg-canvas text-slate-100 flex flex-col">
      {/* ------------------------------ top bar ------------------------------ */}
      <header className="sticky top-0 z-30 shrink-0 border-b border-white/[0.08] bg-canvas/90 backdrop-blur-md">
        <div className="h-12 px-3 sm:px-4 flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" aria-label="ShowUp home" className="shrink-0">
            <BrandWordmark />
          </Link>
          <span className="h-4 w-px bg-white/[0.1] shrink-0" />

          <nav className="flex items-center gap-0.5 shrink-0" aria-label="Primary">
            {(["events", "settings"] as const).map((v) => {
              const active = view === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={cn(
                    "relative h-7 px-2 sm:px-2.5 rounded-md text-[12px] sm:text-[12.5px] font-medium capitalize transition-colors",
                    active ? "text-white" : "text-slate-500 hover:text-slate-200"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="top-nav-pill"
                      transition={SPRING_SNAPPY}
                      className="absolute inset-0 rounded-md bg-white/[0.08]"
                    />
                  )}
                  <span className="relative z-10">{v}</span>
                </button>
              );
            })}
          </nav>

          {view === "events" && events.length > 1 && (
            <select
              aria-label="Select event"
              value={activeEvent?.id || ""}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="hidden sm:block h-7 max-w-[200px] md:max-w-[220px] truncate rounded-md bg-white/[0.04] border border-white/[0.08] px-2 text-[12px] text-slate-200 outline-none focus:border-[#1877f2]"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-[#17191e]">
                  {ev.title}
                </option>
              ))}
            </select>
          )}

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <span
              className="hidden md:inline-flex items-baseline gap-1.5 font-mono tabular-nums text-[12px] text-slate-400"
              title="East Africa Time"
            >
              {fmtEat(now, { seconds: true })}
              <span className="text-[10px] text-slate-600">EAT</span>
            </span>
            <button
              type="button"
              onClick={() => setHostAuthOpen(true)}
              title={signedIn ? formatPhoneDisplay(tenant.phone_e164 || "") : "Sign in"}
              className="inline-flex items-center gap-1.5 h-7 px-2 sm:px-2.5 rounded-md border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] text-[12px] text-slate-300 transition"
            >
              {signedIn ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00a884] shrink-0" />
                  <Smartphone className="w-3.5 h-3.5 text-slate-400 sm:hidden" />
                  <span className="hidden sm:inline font-mono tabular-nums">
                    {formatPhoneDisplay(tenant.phone_e164 || "")}
                  </span>
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden xs:inline">Sign in</span>
                </>
              )}
            </button>
            <Button
              size="sm"
              variant="brand"
              onClick={() => openWizard()}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              <span className="sm:hidden">New</span>
              <span className="hidden sm:inline">New webinar</span>
            </Button>
          </div>
        </div>

        {/* Mobile multi-event switcher row */}
        {view === "events" && events.length > 1 && (
          <div className="sm:hidden px-3 py-1.5 border-t border-white/[0.06] flex items-center gap-2">
            <span className="text-[11px] text-slate-500 shrink-0">Event</span>
            <select
              aria-label="Select event"
              value={activeEvent?.id || ""}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-7 flex-1 min-w-0 truncate rounded-md bg-white/[0.04] border border-white/[0.08] px-2 text-[12px] text-slate-200 outline-none focus:border-[#1877f2]"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-[#17191e]">
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* ------------------------------ workspace ----------------------------- */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto border-x border-white/[0.06] overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={panelKey}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={EASE_OUT_FAST}
          >
            {view === "settings" ? (
              <SettingsView
                tenant={tenant}
                payments={payments}
                templates={templates}
                originUrl={originUrl}
                supabaseReady={supabaseReady}
                devMode={devMode}
                onDevModeChange={updateDevMode}
                onConnect={() => setEmbeddedOpen(true)}
                onReload={loadWorkspace}
                onToast={showToast}
              />
            ) : lifecycle === "zero" || !activeEvent ? (
              <ZeroState
                onCreate={() => openWizard()}
                onSignIn={() => setHostAuthOpen(true)}
                onTestMessage={() => handleSendTest("instant_welcome")}
                sendingTest={sendingTest}
              />
            ) : lifecycle === "finished" ? (
              <FinishedReport
                event={activeEvent}
                registrants={eventRegistrants}
                messages={eventMessages}
                onExport={handleExportCsv}
                onReconcileFile={(f) => handleCsvFile(f, "attendance_reconcile")}
                onShareReport={() => setRoiOpen(true)}
                onDuplicate={() => openWizard({ title: `${activeEvent.title} (next session)` })}
              />
            ) : (
              <CommandCenter
                mode={lifecycle}
                event={activeEvent}
                registrants={eventRegistrants}
                messages={eventMessages}
                templates={templates}
                tenant={tenant}
                now={now}
                origin={originUrl}
                dispatchingStage={dispatchingStage}
                sendingTest={sendingTest}
                onFireStage={handleFireStage}
                onSendTest={handleSendTest}
                onToast={showToast}
                onOpenRegistrants={() => setRegistrantsOpen(true)}
                onEdit={() => openWizard({ event: activeEvent })}
                onLaunch={() => openWizard({ event: activeEvent, step: 3 })}
                onImportFile={(f) => handleCsvFile(f, "registrants")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* -------------------------------- overlays ------------------------------ */}
      <EventSetupWizard
        key={`${wizardEvent?.id || "new"}-${wizardStep}-${prefillTitle}`}
        open={wizardOpen}
        tenant={tenant}
        initialEvent={wizardEvent}
        initialTitle={prefillTitle}
        initialPhone={prefillPhone}
        initialStep={wizardStep}
        eventRegistrants={
          wizardEvent
            ? registrants.filter((r) => r.event_id === wizardEvent.id)
            : eventRegistrants
        }
        originUrl={originUrl}
        onClose={() => setWizardOpen(false)}
        onEventSaved={async (saved) => {
          setWizardEvent(saved);
          setSelectedEventId(saved.id);
          await loadWorkspace();
        }}
        onLaunched={async (id, msg) => {
          setSelectedEventId(id);
          await loadWorkspace();
          setWizardOpen(false);
          setView("events");
          showToast(msg);
        }}
        onOpenEmbeddedSignup={() => setEmbeddedOpen(true)}
        onToast={showToast}
      />

      {activeEvent && (
        <RegistrantsSheet
          open={registrantsOpen}
          onClose={() => setRegistrantsOpen(false)}
          event={activeEvent}
          registrants={eventRegistrants}
          now={now}
          origin={originUrl}
          adding={addingLead}
          onAdd={handleAddRegistrant}
          onExport={handleExportCsv}
          onToast={showToast}
        />
      )}

      {activeEvent && (
        <RoiReportModal
          isOpen={roiOpen}
          onClose={() => setRoiOpen(false)}
          event={activeEvent}
          registrants={eventRegistrants}
          messages={eventMessages}
        />
      )}

      <EmbeddedSignupModal
        isOpen={embeddedOpen}
        onClose={() => setEmbeddedOpen(false)}
        tenant={tenant}
        defaultConfigId={metaConfigId}
        defaultAppId={metaAppId}
        devMode={devMode}
        onConnected={(updated) => {
          setTenant(updated);
          showToast(
            `WhatsApp Business connected (${updated.display_phone_number || updated.waba_id})`
          );
          loadWorkspace();
        }}
      />

      <HostAuthModal
        isOpen={hostAuthOpen}
        onClose={() => setHostAuthOpen(false)}
        onAuthenticated={async (msg) => {
          setSelectedEventId("");
          await loadWorkspace();
          showToast(msg);
        }}
      />

      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />
    </div>
  );
}
