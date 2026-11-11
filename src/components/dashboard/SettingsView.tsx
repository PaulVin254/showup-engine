"use client";

import React, { useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { SequenceStage, ShowUpPayment, ShowUpTemplate, ShowUpTenant } from "@/lib/types";
import { renderTemplatePreview } from "@/lib/default-templates";
import { fmtEat } from "@/lib/lifecycle";
import { cn } from "@/lib/cn";
import { Button, Kbd, StatusPill, inputCls, labelCls } from "@/components/ui/kit";

interface SettingsViewProps {
  tenant: ShowUpTenant;
  payments: ShowUpPayment[];
  templates: ShowUpTemplate[];
  originUrl: string;
  supabaseReady: boolean;
  devMode: boolean;
  onDevModeChange: (v: boolean) => void;
  onConnect: () => void;
  onReload: () => Promise<void>;
  onToast: (msg: string, tone?: "success" | "error" | "info") => void;
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
    <section className="grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-x-10 gap-y-3 px-4 sm:px-6 py-5 sm:py-6 border-b border-white/[0.08]">
      <div className="min-w-0">
        <h2 className="text-[13px] font-medium text-white">{title}</h2>
        {description && <p className="mt-1 text-[12px] text-slate-500 leading-relaxed">{description}</p>}
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
  supabaseReady,
  devMode,
  onDevModeChange,
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
  const connected = tenant.waba_status === "connected";

  const saveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          stageDefault: stage,
          bodyText: body,
          exampleValues: ["Wanjiku", "Nairobi Real Estate Masterclass", "19:00", "Brian", "how to spot high-yield plots"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setName("");
      onToast(`Template ${data.template.name} submitted`);
      await onReload();
    } catch (err) {
      onToast(err instanceof Error ? err.message : "Could not save template", "error");
    } finally {
      setSaving(false);
    }
  };

  const webhook = `${originUrl}/api/webhooks/meta`;

  return (
    <div className="max-w-4xl animate-rise">
      <div className="px-6 pt-7 pb-5 border-b border-white/[0.08]">
        <h1 className="text-[20px] font-semibold tracking-tight text-white">Settings</h1>
        <p className="text-[12.5px] text-slate-500 mt-1">{tenant.business_name}</p>
      </div>

      <Row
        title="Sender"
        description="Reminders go out from the shared ShowUp number until you connect your own WhatsApp Business number."
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <StatusPill tone={connected ? "emerald" : "slate"}>
              {connected ? "Connected" : "Shared number"}
            </StatusPill>
            <span className="font-mono tabular-nums text-[12.5px] text-slate-300">
              {connected ? tenant.display_phone_number || tenant.phone_number_id : "ShowUp Verified"}
            </span>
          </div>
          <Button onClick={onConnect}>{connected ? "Manage connection" : "Connect WhatsApp Business"}</Button>
        </div>
      </Row>

      <Row title="Billing" description="Event passes are paid per webinar via M-Pesa STK push.">
        {payments.length === 0 ? (
          <p className="text-[12.5px] text-slate-500">No payments yet. You pay when you launch a webinar.</p>
        ) : (
          <table className="w-full text-[12.5px]">
            <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-white/[0.08]">
                <th className="py-2 font-medium">Pass</th>
                <th className="py-2 font-medium">Receipt</th>
                <th className="py-2 font-medium hidden sm:table-cell">Date (EAT)</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-white/[0.05]">
                  <td className="py-2.5 text-white capitalize">{p.plan_tier.replace("_", " ")}</td>
                  <td className="py-2.5 font-mono tabular-nums text-slate-400">{p.mpesa_receipt || "—"}</td>
                  <td className="py-2.5 font-mono tabular-nums text-slate-500 hidden sm:table-cell">{fmtEat(p.created_at, { date: true })}</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-white">KES {p.amount_kes.toLocaleString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Row>

      <Row title="Integrations" description="Point Meta Lead Ads or your CRM at these endpoints.">
        <div className="flex items-center justify-between gap-3 h-9 px-3 rounded-md border border-white/[0.08] bg-white/[0.02]">
          <code className="font-mono text-[12px] text-slate-300 truncate">{webhook}</code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(webhook);
              onToast("Webhook URL copied");
            }}
            className="text-slate-500 hover:text-white transition"
            aria-label="Copy webhook URL"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </Row>

      <Row
        title="Message templates"
        description={`${templates.length} templates. Custom templates go through Meta review.`}
      >
        <form onSubmit={saveTemplate} className="space-y-3">
          <div className="grid sm:grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Name</label>
              <input required placeholder="snake_case_name" value={name} onChange={(e) => setName(e.target.value)} className={cn(inputCls, "font-mono")} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as "UTILITY" | "MARKETING")} className={inputCls}>
                <option value="UTILITY">Utility</option>
                <option value="MARKETING">Marketing</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value as SequenceStage | "custom")} className={inputCls}>
                <option value="instant_welcome">1 · Welcome</option>
                <option value="calendar_link">2 · Calendar</option>
                <option value="t_24h">3 · 24h reminder</option>
                <option value="t_1h">4 · 1h reminder</option>
                <option value="live_now">5 · Live link</option>
              </select>
            </div>
          </div>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={cn(inputCls, "h-auto py-2 leading-relaxed")}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-slate-500 truncate">
              {renderTemplatePreview(body, ["Wanjiku", "Masterclass", "19:00", "Brian", "key strategies"]).slice(0, 70)}…
            </span>
            <Button type="submit" variant="brand" loading={saving}>
              Submit template
            </Button>
          </div>
        </form>
      </Row>

      <Row
        title="Developer mode"
        description={
          <>
            Shows Meta diagnostics in the connection dialog. You can also press <Kbd>Ctrl</Kbd>{" "}
            <Kbd>Shift</Kbd> <Kbd>D</Kbd> inside it.
          </>
        }
      >
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            role="switch"
            aria-checked={devMode}
            onClick={() => onDevModeChange(!devMode)}
            className={cn(
              "relative w-9 h-5 rounded-full transition border",
              devMode ? "bg-[#1877f2] border-[#1877f2]" : "bg-white/[0.06] border-white/[0.1]"
            )}
          >
            <span
              className={cn(
                "absolute top-[2px] left-[2px] w-3.5 h-3.5 rounded-full bg-white transition-transform",
                devMode && "translate-x-4"
              )}
            />
          </button>
          <div className="flex items-center gap-3 text-[12px] text-slate-500">
            <span>{supabaseReady ? "Supabase connected" : "Local JSON store"}</span>
            <Button size="sm" onClick={() => onReload()} icon={<RefreshCw className="w-3 h-3" />}>
              Refresh
            </Button>
          </div>
        </div>
      </Row>
    </div>
  );
}

