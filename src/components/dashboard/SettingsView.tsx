"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock, Copy, RefreshCw } from "lucide-react";
import { SequenceStage, ShowUpPayment, ShowUpTemplate, ShowUpTenant } from "@/lib/types";
import {
  buildExampleValuesForBody,
  countTemplatePlaceholders,
  renderTemplatePreview,
} from "@/lib/default-templates";
import { fmtEat } from "@/lib/lifecycle";
import { cn } from "@/lib/cn";
import { Button, EASE_OUT_FAST, StatusPill, inputCls, labelCls } from "@/components/ui/kit";

interface SettingsViewProps {
  tenant: ShowUpTenant;
  payments: ShowUpPayment[];
  templates: ShowUpTemplate[];
  originUrl: string;
  onConnect: () => void;
  onReload: () => Promise<void>;
  onToast: (msg: string, tone?: "success" | "error" | "info") => void;
}

const STAGE_BADGE_LABEL: Record<SequenceStage | "custom", string> = {
  instant_welcome: "1 · Welcome",
  calendar_link: "2 · Calendar",
  t_24h: "3 · 24h reminder",
  t_1h: "4 · 1h reminder",
  live_now: "5 · Live link",
  custom: "Custom",
};

function TemplateStatusPill({ status }: { status: ShowUpTemplate["status"] }) {
  if (status === "PENDING") {
    return (
      <StatusPill tone="amber" pulse>
        In Meta review
      </StatusPill>
    );
  }
  if (status === "REJECTED") {
    return <StatusPill tone="red">Rejected</StatusPill>;
  }
  return <StatusPill tone="emerald">Approved</StatusPill>;
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-x-10 gap-y-3 px-4 sm:px-6 py-6 border-b border-neutral-200">
      <div className="min-w-0">
        <h2 className="text-[13.5px] font-semibold text-[#111111]">{title}</h2>
        {description && <p className="mt-1 text-[12px] text-neutral-500 leading-relaxed">{description}</p>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function SettingsView({
  tenant,
  payments,
  templates,
  originUrl,
  onConnect,
  onReload,
  onToast,
}: SettingsViewProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"UTILITY" | "MARKETING">("UTILITY");
  const [stage, setStage] = useState<SequenceStage | "custom">("t_24h");
  const [body, setBody] = useState(
    "Hi {{1}}, quick reminder that {{2}} goes live tomorrow at {{3}} (EAT).\n\nHosted by {{4}}: {{5}}.\n\nSee you inside!"
  );
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const connected = tenant.waba_status === "connected";
  const hasPendingTemplates = templates.some((t) => t.status === "PENDING") || justSubmitted;
  const approvedCount = templates.filter((t) => t.status === "APPROVED").length;
  const previewExampleValues = buildExampleValuesForBody(body);
  const placeholderCount = countTemplatePlaceholders(body);

  const syncFromMeta = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/whatsapp/templates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sync templates from Meta");
      await onReload();
      if (data.syncError) {
        onToast(`Meta sync failed: ${data.syncError}`, "error");
      } else if (data.syncedFromMeta) {
        onToast("Template statuses synced from Meta");
      } else {
        onToast(
          "Using verified ShowUp templates. Connect your own WhatsApp Business number to sync custom Meta templates.",
          "info"
        );
      }
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Could not sync templates from Meta", "error");
    } finally {
      setSyncing(false);
    }
  };

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const exampleValues = buildExampleValuesForBody(body);
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          stageDefault: stage,
          bodyText: body,
          exampleValues,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName("");
      setJustSubmitted(true);
      onToast(`Template ${data.template.name} submitted for Meta review`);
      await onReload();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Could not save template", "error");
    } finally {
      setSaving(false);
    }
  };

  const loadTemplateIntoEditor = (tpl: ShowUpTemplate) => {
    setName(`${tpl.name}_custom`);
    setCategory(tpl.category);
    setStage(tpl.stage_default);
    setBody(tpl.body_text);
    onToast(`Loaded ${tpl.name} into editor`, "info");
  };

  const webhook = `${originUrl}/api/webhooks/meta`;

  return (
    <div className="max-w-4xl animate-rise bg-white text-[#111111]">
      <div className="px-4 sm:px-6 pt-7 pb-5 border-b border-neutral-200">
        <h1 className="text-[22px] font-semibold tracking-tight text-[#111111]">Settings</h1>
        <p className="text-[12.5px] text-neutral-500 mt-1">{tenant.business_name}</p>
      </div>

      <Row
        title="Sender"
        description="Reminders go out from the shared ShowUp number until you connect your own WhatsApp Business number."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <StatusPill tone={connected ? "emerald" : "slate"}>
              {connected ? "Connected" : "Shared number"}
            </StatusPill>
            <span className="font-mono tabular-nums text-[12.5px] text-neutral-700 truncate">
              {connected ? tenant.display_phone_number || tenant.phone_number_id : "ShowUp Verified"}
            </span>
          </div>
          <Button onClick={onConnect}>{connected ? "Manage connection" : "Connect WhatsApp Business"}</Button>
        </div>
      </Row>

      <Row title="Billing" description="Event passes are paid per webinar via M-Pesa STK push.">
        {payments.length === 0 ? (
          <p className="text-[12.5px] text-neutral-500">No payments yet. You pay when you launch a webinar.</p>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-neutral-500">
              <tr className="border-b border-neutral-200">
                <th className="py-2 font-medium">Pass</th>
                <th className="py-2 font-medium">Receipt</th>
                <th className="py-2 font-medium hidden sm:table-cell">Date (EAT)</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="py-2.5 text-[#111111] font-medium capitalize">{p.plan_tier.replace("_", " ")}</td>
                  <td className="py-2.5 font-mono tabular-nums text-neutral-600">{p.mpesa_receipt || "-"}</td>
                  <td className="py-2.5 font-mono tabular-nums text-neutral-500 hidden sm:table-cell">{fmtEat(p.created_at, { date: true })}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums font-semibold text-[#111111]">KES {p.amount_kes.toLocaleString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Row>

      <Row title="Integrations" description="Point Meta Lead Ads or your CRM at these endpoints.">
        <div className="flex items-center justify-between gap-3 h-10 px-3.5 rounded-xl border border-neutral-200 bg-[#fafafa]">
          <code className="font-mono text-[12px] text-neutral-700 truncate">{webhook}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(webhook);
              onToast("Webhook URL copied");
            }}
            className="text-neutral-500 hover:text-[#111111] transition shrink-0"
            aria-label="Copy webhook URL"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </Row>

      <Row
        title="Message templates"
        description={`${templates.length} templates provisioned. Custom templates require Meta approval before sending from your own WABA.`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono tabular-nums text-[11.5px] text-neutral-500">
              {approvedCount}/{templates.length} approved
            </span>
            <Button
              size="sm"
              variant="secondary"
              loading={syncing}
              onClick={syncFromMeta}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync from Meta
            </Button>
          </div>

          {hasPendingTemplates && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-relaxed">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="min-w-0 flex flex-col gap-1">
                <p className="font-medium text-amber-950">
                  Meta review takes a few minutes up to 24 hours
                </p>
                <p className="text-amber-800/80">
                  While your own templates are pending review, ShowUp automatically falls back to the verified ShowUp number so scheduled webinar reminders still go out on time.
                </p>
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
              {templates.map((tpl) => {
                const expanded = expandedTemplateId === tpl.id;
                const varsCount = countTemplatePlaceholders(tpl.body_text);
                return (
                  <div key={tpl.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedTemplateId(expanded ? null : tpl.id)}
                      aria-expanded={expanded}
                      className="w-full px-3.5 py-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 text-left hover:bg-[#fafafa] transition-colors"
                    >
                      <span className="min-w-0 flex-1 flex items-center gap-2">
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform",
                            expanded && "rotate-180 text-[#111111]"
                          )}
                        />
                        <code className="font-mono text-[12px] text-[#111111] font-medium truncate">
                          {tpl.name}
                        </code>
                      </span>

                      <span className="flex flex-wrap items-center gap-2 shrink-0">
                        <span className="inline-flex items-center h-5 px-2.5 rounded-full border border-neutral-200 bg-[#f4f4f5] text-[10.5px] font-medium text-neutral-700 whitespace-nowrap">
                          {STAGE_BADGE_LABEL[tpl.stage_default] ?? "Custom"}
                        </span>
                        <span className="font-mono text-[10.5px] tracking-wide text-neutral-500 uppercase">
                          {tpl.category}
                        </span>
                        <TemplateStatusPill status={tpl.status} />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {expanded && (
                        <motion.div
                          key="template-body-preview"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={EASE_OUT_FAST}
                          className="overflow-hidden border-t border-neutral-100 bg-[#fafafa]"
                        >
                          <div className="px-3.5 py-3 flex flex-col gap-2.5">
                            <p className="text-[12px] leading-relaxed text-neutral-700 whitespace-pre-wrap break-words">
                              {tpl.body_text}
                            </p>
                            {tpl.button_type === "QUICK_REPLY" && tpl.button_text && (
                              <div className="inline-flex items-center w-max px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-[11px] font-medium text-blue-700">
                                Quick reply: {tpl.button_text}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200/70">
                              <span className="font-mono tabular-nums text-[11px] text-neutral-500">
                                {tpl.language} · {varsCount} variable{varsCount === 1 ? "" : "s"}
                              </span>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => loadTemplateIntoEditor(tpl)}
                              >
                                Load into editor
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={saveTemplate} className="pt-3 flex flex-col gap-3 border-t border-neutral-200">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12.5px] font-semibold text-[#111111]">Submit custom template</span>
              <span className="font-mono tabular-nums text-[11px] text-neutral-500">
                {placeholderCount} variable{placeholderCount === 1 ? "" : "s"} detected
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div>
                <label className={labelCls}>Name</label>
                <input
                  required
                  placeholder="snake_case_name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(inputCls, "font-mono")}
                />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "UTILITY" | "MARKETING")}
                  className={inputCls}
                >
                  <option value="UTILITY">Utility</option>
                  <option value="MARKETING">Marketing</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Stage</label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as SequenceStage | "custom")}
                  className={inputCls}
                >
                  <option value="instant_welcome">1 · Welcome</option>
                  <option value="calendar_link">2 · Calendar</option>
                  <option value="t_24h">3 · 24h reminder</option>
                  <option value="t_1h">4 · 1h reminder</option>
                  <option value="live_now">5 · Live link</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={cn(inputCls, "h-auto py-2 leading-relaxed")}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-[11.5px] text-neutral-500 truncate min-w-0 flex-1">
                {renderTemplatePreview(body, previewExampleValues).slice(0, 80)}...
              </span>
              <Button type="submit" variant="brand" loading={saving}>
                Submit template
              </Button>
            </div>
          </form>
        </div>
      </Row>
    </div>
  );
}
