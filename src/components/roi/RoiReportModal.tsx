"use client";

import React, { useState } from "react";
import { Check, Copy, Printer } from "lucide-react";
import { ShowUpEvent, ShowUpRegistrant, ShowUpScheduledMessage } from "@/lib/types";
import { fmtEat } from "@/lib/lifecycle";
import { computeMetrics } from "@/lib/pipeline";
import { cn } from "@/lib/cn";
import { Button, Dialog, inputCls, labelCls } from "@/components/ui/kit";

interface RoiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShowUpEvent;
  registrants: ShowUpRegistrant[];
  messages: ShowUpScheduledMessage[];
}

const PASS_COST_KES = 1500;
const kes = (n: number) => `KES ${Math.round(n).toLocaleString("en-KE")}`;

export function RoiReportModal({ isOpen, onClose, event, registrants, messages }: RoiReportModalProps) {
  const [adSpend, setAdSpend] = useState(event.ad_spend_kes || 50000);
  const [baselinePct, setBaselinePct] = useState(event.baseline_showup_rate || 20);
  const [offerPrice, setOfferPrice] = useState(event.offer_price_kes || 25000);
  const [closePct, setClosePct] = useState(event.expected_close_rate || 6);
  const [copied, setCopied] = useState(false);

  const m = computeMetrics(registrants, messages);
  const total = Math.max(m.total, 1);
  const baselineAttendees = Math.round((baselinePct / 100) * total);
  const extra = Math.max(0, m.attended - baselineAttendees);
  const costBefore = baselineAttendees > 0 ? adSpend / baselineAttendees : adSpend;
  const costNow = m.attended > 0 ? adSpend / m.attended : adSpend;
  const extraSales = (extra * closePct) / 100;
  const extraRevenue = extraSales * offerPrice;
  const roiX = Math.max(1, Math.round(extraRevenue / PASS_COST_KES));
  const { fullStr } = { fullStr: `${fmtEat(event.starts_at, { date: true })} EAT` };

  const shareText = `*${event.title}* · attendance report (${fullStr})

Registered: ${m.total}
Attended live: ${m.attended} (${m.showupPct}%)
Baseline (${baselinePct}%): ${baselineAttendees}
Extra people in the room: +${extra}
${m.deliveryPct !== null ? `WhatsApp delivery: ${m.deliveryPct}%` + (m.readPct !== null ? ` · read ${m.readPct}%` : "") + "\n" : ""}
Cost per attendee: ${kes(costNow)} (was ${kes(costBefore)})
Est. extra sales: ${kes(extraRevenue)} at ${closePct}% close on ${kes(offerPrice)}
Event pass: ${kes(PASS_COST_KES)} → ~${roiX}x return`;

  const copyReport = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const inputs: Array<[string, number, (n: number) => void]> = [
    ["Ad spend (KES)", adSpend, setAdSpend],
    ["Baseline show-up %", baselinePct, setBaselinePct],
    ["Offer price (KES)", offerPrice, setOfferPrice],
    ["Close rate %", closePct, setClosePct],
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="ROI report"
      description={`${event.title} · ${fullStr}`}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="ghost" onClick={() => window.print()} icon={<Printer className="w-3.5 h-3.5" />}>
            Print / PDF
          </Button>
          <Button
            variant="brand"
            onClick={copyReport}
            icon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? "Copied" : "Copy for WhatsApp"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {inputs.map(([label, value, set]) => (
            <div key={label}>
              <label className={cn(labelCls, "text-[11px] truncate")}>{label}</label>
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => set(Number(e.target.value) || 0)}
                className={cn(inputCls, "font-mono tabular-nums")}
              />
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 rounded-md border border-white/[0.08] divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          {[
            { l: "Show-up", v: `${m.showupPct}%`, s: `+${extra} vs ${baselinePct}% baseline`, t: "text-[#00a884]" },
            { l: "Cost / attendee", v: kes(costNow), s: `was ${kes(costBefore)}`, t: "text-white" },
            { l: "Est. extra sales", v: kes(extraRevenue), s: `~${extraSales.toFixed(1)} sales · ${roiX}x pass`, t: "text-white" },
          ].map((x) => (
            <div key={x.l} className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.08em] text-slate-500">{x.l}</div>
              <div className={cn("mt-1 font-mono tabular-nums text-[20px] font-medium", x.t)}>{x.v}</div>
              <div className="mt-0.5 text-[11.5px] text-slate-500">{x.s}</div>
            </div>
          ))}
        </div>

        <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-mono text-slate-300 rounded-md border border-white/[0.08] bg-white/[0.02] p-3.5">
          {shareText}
        </pre>
      </div>
    </Dialog>
  );
}
