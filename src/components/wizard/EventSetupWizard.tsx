"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Trash2, Upload } from "lucide-react";
import { SenderMode, ShowUpEvent, ShowUpRegistrant, ShowUpTenant } from "@/lib/types";
import { normalizeKenyanPhone, formatPhoneDisplay } from "@/lib/phone";
import {
  PIPELINE_STAGES,
  detectMeetingPlatform,
  normalizeJoinUrl,
  stageTimingLabel,
} from "@/lib/pipeline";
import { csvToLeadRows } from "@/lib/csv";
import { cn } from "@/lib/cn";
import {
  Button,
  Dialog,
  EASE_OUT_FAST,
  SPRING_SNAPPY,
  StatusPill,
  inputCls,
  labelCls,
} from "@/components/ui/kit";

interface EventSetupWizardProps {
  open: boolean;
  tenant: ShowUpTenant;
  initialEvent?: ShowUpEvent | null;
  initialTitle?: string;
  initialPhone?: string;
  initialStep?: 1 | 2 | 3;
  eventRegistrants: ShowUpRegistrant[];
  originUrl: string;
  onClose: () => void;
  onEventSaved: (event: ShowUpEvent) => Promise<void>;
  onLaunched: (eventId: string, message: string) => Promise<void>;
  onOpenEmbeddedSignup: () => void;
  onToast: (msg: string) => void;
  onDelete?: (eventId: string) => void;
}

const EAT_OFFSET_MS = 3 * 3600 * 1000;

/** ISO (UTC) -> "YYYY-MM-DDTHH:mm" in East Africa Time. */
const isoToEatLocal = (iso: string) =>
  new Date(new Date(iso).getTime() + EAT_OFFSET_MS).toISOString().slice(0, 16);
/** "YYYY-MM-DDTHH:mm" in EAT -> ISO (UTC). */
const eatLocalToIso = (local: string) => new Date(`${local}:00+03:00`).toISOString();

const STEPS = ["Details", "Leads", "Launch"] as const;

export function EventSetupWizard({
  open,
  tenant,
  initialEvent,
  initialTitle = "",
  initialPhone = "",
  initialStep = 1,
  eventRegistrants,
  originUrl,
  onClose,
  onEventSaved,
  onLaunched,
  onOpenEmbeddedSignup,
  onToast,
  onDelete,
}: EventSetupWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(initialEvent ? initialStep : 1);
  const [dir, setDir] = useState<1 | -1>(1);
  const [currentEvent, setCurrentEvent] = useState<ShowUpEvent | null>(initialEvent || null);

  const goStep = (next: 1 | 2 | 3) => {
    setDir(next >= step ? 1 : -1);
    setStep(next);
  };

  // Step 1
  const cleanInitialHost =
    initialEvent?.host_name && !/^your('?s)?(\s+live\s+room)?$/i.test(initialEvent.host_name.trim())
      ? initialEvent.host_name
      : tenant.business_name && !/^your('?s)?(\s+live\s+room)?$/i.test(tenant.business_name.trim())
      ? tenant.business_name.replace(/'s Live Room$/i, "")
      : "";
  const [title, setTitle] = useState(initialEvent?.title || initialTitle || "");
  const [hostName, setHostName] = useState(cleanInitialHost);
  const [startsAtLocal, setStartsAtLocal] = useState(() => {
    if (initialEvent?.starts_at) return isoToEatLocal(initialEvent.starts_at);
    const d = new Date(Date.now() + 2 * 24 * 3600 * 1000 + EAT_OFFSET_MS);
    d.setUTCHours(19, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [joinUrl, setJoinUrl] = useState(initialEvent?.join_url || "");
  const [addLinkLater, setAddLinkLater] = useState(
    initialEvent ? !initialEvent.join_url : false
  );
  const [hostPhone, setHostPhone] = useState(initialPhone || tenant.phone_e164 || "");
  const [saving, setSaving] = useState(false);

  // Step 2
  const [leadTab, setLeadTab] = useState<"page" | "paste" | "meta">("page");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [importing, setImporting] = useState(false);

  // Step 3
  const [senderMode, setSenderMode] = useState<SenderMode>(
    initialEvent?.sender_mode || "shared_showup"
  );
  const [passTier, setPassTier] = useState<"event_pass" | "event_scale">("event_pass");
  const [mpesaPhone, setMpesaPhone] = useState(initialPhone || tenant.phone_e164 || "");
  const [paying, setPaying] = useState(false);

  const showContactPhoneField = !tenant.phone_e164;
  const hostNorm = normalizeKenyanPhone(hostPhone);
  const mpesaNorm = normalizeKenyanPhone(mpesaPhone);
  const leadCount = eventRegistrants.length;
  const priceKes = passTier === "event_scale" ? 3000 : 1500;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

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

  const saveStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showContactPhoneField && hostPhone.trim() && !hostNorm) {
      onToast("Enter a valid Kenyan phone number or leave it blank");
      return;
    }
    setSaving(true);
    const finalJoinUrl = addLinkLater ? "" : normalizeJoinUrl(joinUrl);
    try {
      const data = await postJson("/api/events", {
        eventId: currentEvent?.id,
        title: title.trim(),
        hostName: hostName.trim() || "ShowUp Host",
        hostPhone: showContactPhoneField && hostPhone.trim() ? hostPhone.trim() : undefined,
        startsAt: eatLocalToIso(startsAtLocal),
        joinUrl: finalJoinUrl,
        senderMode,
      });
      setCurrentEvent(data.event);
      if (!mpesaPhone) setMpesaPhone(hostPhone.trim());
      await onEventSaved(data.event);
      goStep(2);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Could not save webinar");
    } finally {
      setSaving(false);
    }
  };

  const importRows = async (rows: Array<{ name: string; phone: string; email?: string }>) => {
    if (!currentEvent || rows.length === 0) return;
    setImporting(true);
    try {
      const data = await postJson(`/api/events/${currentEvent.id}/import-csv`, {
        rows,
        mode: "registrants",
      });
      onToast(data.message || `Added ${rows.length} people`);
      setPasteText("");
      await onEventSaved(currentEvent);
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const importPasted = () =>
    importRows(
      pasteText
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const p = line.split(/[,;\t]+/).map((x) => x.trim());
          return p.length >= 2
            ? { name: p[0], phone: p[1], email: p[2] }
            : { name: "Lead", phone: p[0] };
        })
    );

  const payAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent) return;
    if (!mpesaNorm) {
      onToast("Enter a valid M-Pesa number");
      return;
    }
    setPaying(true);
    try {
      const data = await postJson("/api/billing/stk-push", {
        planTier: passTier,
        phone: mpesaPhone,
        eventId: currentEvent.id,
        senderMode,
      });
      await onLaunched(currentEvent.id, data.message || "STK push sent. Check your phone.");
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setPaying(false);
    }
  };

  const pastedCount = pasteText.split(/\r?\n/).filter((l) => l.trim()).length;
  const previewEvent: ShowUpEvent | null = currentEvent;

  const footer =
    step === 1 ? (
      <>
        {initialEvent && onDelete ? (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (
                window.confirm(
                  `Permanently delete "${initialEvent.title}"? This cannot be undone.`
                )
              ) {
                onDelete(initialEvent.id);
                onClose();
              }
            }}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete webinar
          </Button>
        ) : (
          <span className="text-[11.5px] text-neutral-500">Times are East Africa Time (UTC+3)</span>
        )}
        <div className="flex-1" />
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="wiz-step1" variant="brand" loading={saving}>
          {initialEvent ? "Save changes" : "Continue"}
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </>
    ) : step === 2 ? (
      <>
        <Button
          variant="ghost"
          onClick={() => goStep(1)}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <Button variant="brand" onClick={() => goStep(3)}>
          Continue
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </>
    ) : (
      <>
        <Button
          variant="ghost"
          onClick={() => goStep(2)}
          icon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Back
        </Button>
        <Button type="submit" form="wiz-step3" variant="success" loading={paying}>
          Pay KES {priceKes.toLocaleString("en-KE")} via M-Pesa
        </Button>
      </>
    );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={initialEvent ? "Edit webinar" : "New webinar"}
      width="max-w-xl"
      footer={footer}
    >
      {/* Stepper */}
      <ol className="flex items-center gap-2 mb-5 text-[12px]">
        {STEPS.map((label, i) => {
          const n = (i + 1) as 1 | 2 | 3;
          const done = step > n;
          const enabled = n === 1 || Boolean(currentEvent);
          return (
            <React.Fragment key={label}>
              {i > 0 && <span aria-hidden className="h-px w-6 bg-neutral-200" />}
              <li>
                <button
                  type="button"
                  disabled={!enabled}
                  onClick={() => goStep(n)}
                  aria-current={step === n ? "step" : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 font-medium transition disabled:opacity-40",
                    step === n ? "text-[#111111]" : done ? "text-neutral-700" : "text-neutral-400"
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center font-mono text-[10px] border",
                      step === n && "border-[#111111] bg-[#111111] text-white",
                      done && "border-emerald-300 bg-emerald-50 text-[#00a884]",
                      step < n && "border-neutral-300 bg-white text-neutral-400"
                    )}
                  >
                    {done ? <Check className="w-2.5 h-2.5" /> : n}
                  </span>
                  {label}
                </button>
              </li>
            </React.Fragment>
          );
        })}
      </ol>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        {/* Step 1 */}
        {step === 1 && (
          <motion.form
            key="wiz-step-1"
            id="wiz-step1"
            onSubmit={saveStep1}
            initial={{ opacity: 0, x: dir * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -18 }}
            transition={EASE_OUT_FAST}
            className="flex flex-col gap-4"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Webinar title</label>
                <input
                  required
                  autoFocus
                  placeholder="Free Real Estate Masterclass"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Host / presenter name</label>
                <input
                  placeholder="e.g. Paul Wakoli"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>
            <div className={cn("grid gap-3", showContactPhoneField && "sm:grid-cols-2")}>
              <div>
                <label className={labelCls}>Starts (EAT)</label>
                <input
                  required
                  type="datetime-local"
                  value={startsAtLocal}
                  onChange={(e) => setStartsAtLocal(e.target.value)}
                  className={cn(inputCls, "font-mono tabular-nums")}
                />
              </div>
              {showContactPhoneField && (
                <div>
                  <label className={labelCls}>Host contact / M-Pesa phone (optional)</label>
                  <input
                    type="tel"
                    placeholder="0712 345 678"
                    value={hostPhone}
                    onChange={(e) => setHostPhone(e.target.value)}
                    className={cn(
                      inputCls,
                      "font-mono tabular-nums",
                      hostPhone.length > 3 && !hostNorm && "border-red-500"
                    )}
                  />
                  <div className="mt-1 h-3.5 text-[10.5px] font-mono tabular-nums text-neutral-500">
                    {hostNorm ? `-> +${hostNorm}` : ""}
                  </div>
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={labelCls}>Join link (Zoom, Meet or YouTube)</label>
                {!addLinkLater && detectMeetingPlatform(joinUrl) && (
                  <span className={cn("text-[11px] font-medium", detectMeetingPlatform(joinUrl)!.badgeColor)}>
                    ✓ {detectMeetingPlatform(joinUrl)!.name}
                  </span>
                )}
              </div>
              <input
                type="text"
                disabled={addLinkLater}
                placeholder="e.g. meet.google.com/xyz or zoom.us/j/..."
                value={joinUrl}
                onChange={(e) => setJoinUrl(e.target.value)}
                onBlur={() => {
                  if (joinUrl.trim()) setJoinUrl(normalizeJoinUrl(joinUrl));
                }}
                className={cn(inputCls, "font-mono", addLinkLater && "opacity-40 cursor-not-allowed")}
              />
              <label className="mt-2.5 flex items-center gap-2 text-[12px] text-neutral-600 cursor-pointer select-none hover:text-[#111111] transition">
                <input
                  type="checkbox"
                  checked={addLinkLater}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAddLinkLater(checked);
                    if (checked) {
                      setJoinUrl("");
                    }
                  }}
                  className="w-3.5 h-3.5 rounded accent-[#111111] cursor-pointer"
                />
                <span>I don&apos;t have the link yet (I&apos;ll add it before going live)</span>
              </label>
              {addLinkLater && (
                <p className="mt-1.5 text-[11px] text-neutral-500 leading-relaxed">
                  You can collect registrations right away. Stage 5 (Live Link) requires your URL before T-5m.
                </p>
              )}
            </div>
          </motion.form>
        )}

        {/* Step 2 */}
        {step === 2 && currentEvent && (
          <motion.div
            key="wiz-step-2"
            initial={{ opacity: 0, x: dir * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -18 }}
            transition={EASE_OUT_FAST}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex flex-wrap p-0.5 rounded-full bg-[#f4f4f5] border border-neutral-200 text-[12px]">
                {(
                  [
                    ["page", "Reg page"],
                    ["paste", "Paste / CSV"],
                    ["meta", "Meta Ads"],
                  ] as const
                ).map(([id, label]) => {
                  const active = leadTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLeadTab(id)}
                      className={cn(
                        "relative h-7 px-3 rounded-full font-medium transition-colors",
                        active ? "text-[#111111]" : "text-neutral-500 hover:text-[#111111]"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="wizard-lead-tab"
                          transition={SPRING_SNAPPY}
                          className="absolute inset-0 rounded-full bg-white shadow-xs"
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>
              <StatusPill tone={leadCount > 0 ? "emerald" : "slate"}>
                <span className="font-mono tabular-nums">{leadCount}</span> ready
              </StatusPill>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {leadTab === "page" && (
                <motion.div
                  key="tab-page"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center gap-2 h-10 pl-3.5 pr-1.5 rounded-xl border border-neutral-200 bg-[#fafafa]">
                    <code className="flex-1 truncate font-mono text-[12px] text-[#111111]">
                      {originUrl}/r/{currentEvent.slug}
                    </code>
                    <Button
                      size="sm"
                      onClick={() => copyText("reg", `${originUrl}/r/${currentEvent.slug}`)}
                      icon={
                        copiedKey === "reg" ? (
                          <Check className="w-3 h-3 text-[#00a884]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )
                      }
                    >
                      {copiedKey === "reg" ? "Copied" : "Copy"}
                    </Button>
                    <Link
                      href={`/r/${currentEvent.slug}`}
                      target="_blank"
                      className="h-7 px-2 inline-flex items-center rounded-full text-neutral-500 hover:text-[#111111] hover:bg-neutral-200/60"
                      aria-label="Preview registration page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <p className="text-[12px] text-neutral-500">
                    Use it in ads, your bio or WhatsApp status. Every signup joins the sequence
                    automatically.
                  </p>
                </motion.div>
              )}

              {leadTab === "paste" && (
                <motion.div
                  key="tab-paste"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="flex flex-col gap-3"
                >
                  <textarea
                    rows={5}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={"Wanjiku Kamau, 0712 345 678\nBrian Otieno, +254 722 000 111"}
                    className={cn(inputCls, "h-auto py-2.5 font-mono text-[12px] leading-relaxed")}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 text-[12px] text-neutral-600 hover:text-[#111111] cursor-pointer transition">
                      <Upload className="w-3.5 h-3.5" />
                      Upload CSV
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (f) await importRows(csvToLeadRows(await f.text()));
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <Button
                      variant="brand"
                      size="sm"
                      loading={importing}
                      disabled={pastedCount === 0}
                      onClick={importPasted}
                    >
                      Add {pastedCount || ""} {pastedCount === 1 ? "person" : "people"}
                    </Button>
                  </div>
                  <p className="text-[11.5px] text-neutral-500">
                    07XX, 01XX and +254 formats are normalised to +254.
                  </p>
                </motion.div>
              )}

              {leadTab === "meta" && (
                <motion.div
                  key="tab-meta"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.14 }}
                  className="flex flex-col gap-3"
                >
                  <p className="text-[12px] text-neutral-600">
                    POST <code className="font-mono text-[#111111] bg-[#f4f4f5] px-1.5 py-0.5 rounded">{"{ fullName, phone }"}</code>{" "}
                    from Meta Lead Ads, Zapier or Make.
                  </p>
                  <div className="flex items-center gap-2 h-10 pl-3.5 pr-1.5 rounded-xl border border-neutral-200 bg-[#fafafa]">
                    <code className="flex-1 truncate font-mono text-[12px] text-[#111111]">
                      {originUrl}/api/events/{currentEvent.id}/register
                    </code>
                    <Button
                      size="sm"
                      onClick={() =>
                        copyText("hook", `${originUrl}/api/events/${currentEvent.id}/register`)
                      }
                      icon={
                        copiedKey === "hook" ? (
                          <Check className="w-3 h-3 text-[#00a884]" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )
                      }
                    >
                      {copiedKey === "hook" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Step 3 */}
        {step === 3 && currentEvent && (
          <motion.form
            key="wiz-step-3"
            id="wiz-step3"
            onSubmit={payAndLaunch}
            initial={{ opacity: 0, x: dir * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -18 }}
            transition={EASE_OUT_FAST}
            className="flex flex-col gap-5"
          >
            <div>
              <div className={labelCls}>Sequence</div>
              <ul className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 bg-[#fafafa]">
                {PIPELINE_STAGES.map((s) => (
                  <li key={s.key} className="flex items-center gap-3 px-3.5 h-9 text-[12.5px]">
                    <span className="font-mono tabular-nums text-[11px] text-neutral-400 w-3">
                      {s.step}
                    </span>
                    <span className="text-[#111111] font-medium">{s.label}</span>
                    {s.key === "live_now" && !currentEvent.join_url && (
                      <StatusPill tone="amber" dot={false}>Link pending</StatusPill>
                    )}
                    <span className="ml-auto font-mono tabular-nums text-[11.5px] text-neutral-500">
                      {previewEvent ? stageTimingLabel(s, previewEvent) : s.rule}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div role="radiogroup" aria-label="Sender" className="grid sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    mode: "shared_showup" as const,
                    title: "ShowUp number",
                    sub: "Verified, no setup. Sends immediately.",
                    badge: "Instant",
                  },
                  {
                    mode: "own_waba" as const,
                    title: "My business number",
                    sub:
                      tenant.waba_status === "connected"
                        ? `Sending from ${tenant.display_phone_number}`
                        : "Connect via Meta. Falls back to ShowUp while templates are reviewed.",
                    badge: tenant.waba_status === "connected" ? "Connected" : "Connect",
                  },
                ]
              ).map((o) => (
                <button
                  key={o.mode}
                  type="button"
                  role="radio"
                  aria-checked={senderMode === o.mode}
                  onClick={() => {
                    setSenderMode(o.mode);
                    if (o.mode === "own_waba" && tenant.waba_status !== "connected")
                      onOpenEmbeddedSignup();
                  }}
                  className={cn(
                    "text-left rounded-xl border p-3 transition",
                    senderMode === o.mode
                      ? "border-[#111111] bg-[#f4f4f5]"
                      : "border-neutral-200 bg-white hover:border-neutral-300"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-medium text-[#111111]">{o.title}</span>
                    <StatusPill
                      tone={
                        o.mode === "shared_showup"
                          ? "emerald"
                          : tenant.waba_status === "connected"
                          ? "emerald"
                          : "slate"
                      }
                      dot={false}
                    >
                      {o.badge}
                    </StatusPill>
                  </div>
                  <p className="mt-1 text-[11.5px] text-neutral-500 leading-snug">{o.sub}</p>
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-neutral-200 bg-[#fafafa] p-3.5 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[12.5px] text-neutral-600">
                  <span className="font-mono tabular-nums font-semibold text-[#111111]">{leadCount}</span> leads
                  queued.{" "}
                  <span className="text-neutral-500">Welcome messages send on payment.</span>
                </div>
                <div className="inline-flex p-0.5 rounded-full bg-white border border-neutral-200 text-[11.5px] shrink-0">
                  {(
                    [
                      ["event_pass", "200 · 1,500"],
                      ["event_scale", "500 · 3,000"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPassTier(id)}
                      className={cn(
                        "h-6 px-2.5 rounded-full font-mono tabular-nums transition",
                        passTier === id ? "bg-[#111111] text-white" : "text-neutral-500"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls}>M-Pesa number (STK push)</label>
                <input
                  required
                  type="tel"
                  placeholder="0712 345 678"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className={cn(
                    inputCls,
                    "font-mono tabular-nums",
                    mpesaPhone.length > 3 && !mpesaNorm && "border-red-500"
                  )}
                />
                <div className="mt-1 h-3.5 text-[10.5px] font-mono tabular-nums text-neutral-500">
                  {mpesaNorm ? `Prompt goes to ${formatPhoneDisplay(mpesaNorm)}` : ""}
                </div>
              </div>
              <p className="text-[11.5px] text-neutral-500">
                Full refund if fewer than 30% of registrants show up.
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
