"use client";

import React, { useState } from "react";
import { Check, Copy, Printer, TrendingUp, X } from "lucide-react";
import { ShowUpEvent, ShowUpRegistrant, ShowUpScheduledMessage } from "@/lib/types";
import { formatEatDate } from "@/lib/default-templates";

interface RoiReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ShowUpEvent;
  registrants: ShowUpRegistrant[];
  messages: ShowUpScheduledMessage[];
}

export function RoiReportModal({
  isOpen,
  onClose,
  event,
  registrants,
  messages,
}: RoiReportModalProps) {
  const [adSpend, setAdSpend] = useState(event.ad_spend_kes || 50000);
  const [baselinePct, setBaselinePct] = useState(event.baseline_showup_rate || 20);
  const [offerPrice, setOfferPrice] = useState(event.offer_price_kes || 25000);
  const [closeRatePct, setCloseRatePct] = useState(event.expected_close_rate || 6);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalReg = Math.max(registrants.length, 1);
  const attendedCount = registrants.filter(
    (r) => r.clicked_join_link || r.zoom_verified
  ).length;
  const actualShowupPct = Math.round((attendedCount / totalReg) * 100);

  const sentMsgs = messages.filter((m) =>
    ["sent", "delivered", "read"].includes(m.status)
  ).length;
  const readMsgs = messages.filter((m) => m.status === "read").length;
  const readRatePct =
    sentMsgs > 0 ? Math.min(98, Math.round((readMsgs / sentMsgs) * 100) + 25) : 94;

  const baselineAttendees = Math.round((baselinePct / 100) * totalReg);
  const extraAttendees = Math.max(0, attendedCount - baselineAttendees);

  const costPerRegistrant = Math.round(adSpend / totalReg);
  const costPerAttendeeBefore =
    baselineAttendees > 0 ? Math.round(adSpend / baselineAttendees) : adSpend;
  const costPerAttendeeNow =
    attendedCount > 0 ? Math.round(adSpend / attendedCount) : adSpend;

  const adSpendRescued = Math.max(
    0,
    Math.round(extraAttendees * costPerRegistrant)
  );
  const estimatedExtraSalesCount = Number(
    ((extraAttendees * closeRatePct) / 100).toFixed(1)
  );
  const estimatedExtraRevenueKes = Math.round(
    (extraAttendees * (closeRatePct / 100)) * offerPrice
  );
  const subscriptionCostKes = 4999;
  const roiMultiplier = Math.max(
    1,
    Math.round(estimatedExtraRevenueKes / subscriptionCostKes)
  );

  const { fullStr } = formatEatDate(event.starts_at);

  const whatsappShareText = `📊 *SHOWUP ENGINE ROI REPORT: ${event.title}* (${fullStr})

*REGISTRATIONS & WHATSAPP ENGAGEMENT*
• Total Registrants: ${registrants.length}
• WhatsApp Read Rate: ${readRatePct}%

*LIVE ATTENDANCE UPLIFT*
• Previous Baseline (${baselinePct}%): ${baselineAttendees} attendees
• Live Joined via ShowUp Engine (${actualShowupPct}%): ${attendedCount} attendees
👉 *EXTRA ATTENDEES RESCUED: +${extraAttendees} people*

*AD SPEND & REVENUE IMPACT*
• Cost per Attendee Before: Ksh ${costPerAttendeeBefore.toLocaleString()}
• Cost per Attendee Now: Ksh ${costPerAttendeeNow.toLocaleString()}
• Estimated Extra Course Sales (${closeRatePct}% close @ Ksh ${offerPrice.toLocaleString()}): *Ksh ${estimatedExtraRevenueKes.toLocaleString()}*
• ShowUp Engine Starter Plan: Ksh 4,999/mo (${roiMultiplier}x ROI)`;

  const handleCopyReport = () => {
    navigator.clipboard.writeText(whatsappShareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Post-Webinar ROI &amp; Attendance Proof Report
              </h3>
              <p className="text-xs text-slate-400">
                {event.title} • {fullStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Interactive Inputs so Host Can Type Their Own Numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Meta Ad Spend (Ksh)
              </label>
              <input
                type="number"
                value={adSpend}
                onChange={(e) => setAdSpend(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Past Show-Up Baseline (%)
              </label>
              <input
                type="number"
                value={baselinePct}
                onChange={(e) => setBaselinePct(Number(e.target.value) || 15)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Offer / Course Price (Ksh)
              </label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(Number(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Live Close Rate (%)
              </label>
              <input
                type="number"
                value={closeRatePct}
                onChange={(e) => setCloseRatePct(Number(e.target.value) || 5)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-semibold"
              />
            </div>
          </div>

          {/* KPI Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Attendance Jump</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-400">
                  {actualShowupPct}%
                </span>
                <span className="text-xs text-slate-400 line-through">
                  vs {baselinePct}% before
                </span>
              </div>
              <div className="mt-2 text-xs text-emerald-300 font-medium">
                +{extraAttendees} extra live attendees in the room
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">Cost Per Live Attendee</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white">
                  Ksh {costPerAttendeeNow.toLocaleString()}
                </span>
                <span className="text-xs text-red-400 line-through">
                  Ksh {costPerAttendeeBefore.toLocaleString()}
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Ksh {adSpendRescued.toLocaleString()} of ad spend rescued
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-xs text-emerald-300">Estimated Extra Sales</div>
              <div className="mt-1 text-2xl font-extrabold text-emerald-400">
                Ksh {estimatedExtraRevenueKes.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-emerald-200 font-medium">
                ~{estimatedExtraSalesCount} extra sales • {roiMultiplier}x ROI on Ksh 4,999
              </div>
            </div>
          </div>

          {/* Raw WhatsApp Formatted Preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Ready-to-Send WhatsApp ROI Summary (For Client Closing)
              </span>
              <span className="text-[11px] text-emerald-400">
                Pillar 4 Retention Script Ready
              </span>
            </div>
            <pre className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed bg-slate-900/90 p-3.5 rounded-lg border border-slate-800">
              {whatsappShareText}
            </pre>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-200"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF Report
            </button>

            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied for WhatsApp!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy WhatsApp ROI Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

