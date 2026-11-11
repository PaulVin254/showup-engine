"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Check,
  Copy,
  Mic,
  MoreVertical,
  Phone,
  Plus,
  Send,
  Video,
} from "lucide-react";
import { SequenceStage, ShowUpEvent, ShowUpTemplate } from "@/lib/types";
import { renderTemplatePreview } from "@/lib/default-templates";
import { fmtEat } from "@/lib/lifecycle";
import {
  PIPELINE_STAGES,
  stagePreviewValues,
  stageSendAt,
  stageTemplate,
} from "@/lib/pipeline";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { Button, Kbd, SPRING_SNAPPY, StatusPill } from "@/components/ui/kit";

/** Renders *bold* and bare URLs the way WhatsApp does. */
function WaText({ text }: { text: string }) {
  const parts = text.split(
    /(\*[^*\n]+\*|https?:\/\/\S+|[a-z0-9.-]+\/j\/\S+|calendar\.google\.com\S+)/g
  );
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (/^\*[^*\n]+\*$/.test(p))
          return (
            <strong key={i} className="font-semibold">
              {p.slice(1, -1)}
            </strong>
          );
        if (/^(https?:\/\/|[a-z0-9.-]+\/j\/|calendar\.google\.com)/.test(p))
          return (
            <span key={i} className="text-[#53bdeb] break-all">
              {p}
            </span>
          );
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </>
  );
}

interface PhonePreviewProps {
  event: ShowUpEvent;
  templates: ShowUpTemplate[];
  senderName: string;
  senderPhone?: string | null;
  hostPhone?: string | null;
  origin: string;
  stage: SequenceStage;
  onStageChange: (s: SequenceStage) => void;
  sendingTest: boolean;
  onSendTest: (stage: SequenceStage) => void;
  onToast: (msg: string) => void;
}

export function PhonePreview({
  event,
  templates,
  senderName,
  senderPhone,
  hostPhone,
  origin,
  stage,
  onStageChange,
  sendingTest,
  onSendTest,
  onToast,
}: PhonePreviewProps) {
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const tablistRef = useRef<HTMLDivElement>(null);
  const idx = PIPELINE_STAGES.findIndex((s) => s.key === stage);
  const meta = PIPELINE_STAGES[idx];
  const tpl = stageTemplate(stage);
  const stored = templates.find((t) => t.name === tpl.name);
  const body = renderTemplatePreview(tpl.body_text, stagePreviewValues(stage, event, origin));
  const sendAt = stageSendAt(meta, event) ?? new Date(event.created_at).getTime();

  const selectStage = (nextStage: SequenceStage) => {
    const nextIdx = PIPELINE_STAGES.findIndex((s) => s.key === nextStage);
    setDirection(nextIdx >= idx ? 1 : -1);
    onStageChange(nextStage);
  };

  useEffect(() => {
    const el = tablistRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") selectStage(PIPELINE_STAGES[Math.min(idx + 1, 4)].key);
      if (e.key === "ArrowLeft") selectStage(PIPELINE_STAGES[Math.max(idx - 1, 0)].key);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, onStageChange]);

  const copy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    onToast("Message copied");
    setTimeout(() => setCopied(false), 1600);
  };

  const initials = senderName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col">
      {/* Scrubber with shared layoutId indicator */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Message stage"
        className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.08]"
      >
        {PIPELINE_STAGES.map((s) => {
          const active = s.key === stage;
          return (
            <button
              key={s.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => selectStage(s.key)}
              className={cn(
                "relative h-8 rounded-md text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
                active ? "text-white" : "text-slate-500 hover:text-slate-200"
              )}
            >
              {active && (
                <motion.span
                  layoutId="scrubber-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-md bg-white/[0.09] shadow-sm"
                />
              )}
              <span className="relative z-10 font-mono tabular-nums opacity-60">{s.step}</span>
              <span className="relative z-10 hidden xl:inline truncate">
                {s.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Handset */}
      <div className="mt-4 mx-auto w-full max-w-[340px] rounded-[28px] border-[5px] border-[#1b1e24] bg-[#0b141a] overflow-hidden shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]">
        <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00a884] to-[#056b57] flex items-center justify-center text-[12px] font-semibold text-white shrink-0">
            {initials || "SU"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-medium text-[#e9edef] truncate">{senderName}</span>
              <BadgeCheck
                className="w-[15px] h-[15px] text-[#00a884] shrink-0"
                fill="#00a884"
                stroke="#202c33"
              />
            </div>
            <div className="text-[11px] text-[#8696a0] truncate">
              {senderPhone ? formatPhoneDisplay(senderPhone) : "Business account"}
            </div>
          </div>
          <Video className="w-[18px] h-[18px] text-[#aebac1]" />
          <Phone className="w-4 h-4 text-[#aebac1]" />
          <MoreVertical className="w-4 h-4 text-[#aebac1]" />
        </div>

        <div className="wa-wallpaper min-h-[400px] px-3 py-4 flex flex-col gap-2 overflow-hidden">
          <div className="self-center px-2.5 py-0.5 rounded-md bg-[#182229] text-[10.5px] text-[#8696a0] font-medium">
            {fmtEat(sendAt, { date: true }).split(",")[0]}
          </div>

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={stage}
              custom={direction}
              initial={{ opacity: 0, x: direction * 14, y: 4 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: direction * -10, y: -2 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-[88%]"
            >
              <div className="relative bg-[#202c33] text-[#e9edef] rounded-lg rounded-tl-none px-2.5 pt-2 pb-1.5 shadow">
                <p className="text-[13.5px] leading-[1.35] whitespace-pre-wrap">
                  <WaText text={body} />
                </p>
                <div className="text-right text-[10.5px] text-[#8696a0] mt-0.5 font-mono tabular-nums">
                  {fmtEat(sendAt)}
                </div>
              </div>
              {tpl.button_text && (
                <div className="mt-0.5 rounded-lg bg-[#202c33] py-2 text-center text-[13px] font-medium text-[#53bdeb] flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5 -scale-x-100" />
                  {tpl.button_text}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="bg-[#202c33] px-2.5 py-2 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#8696a0]" />
          <div className="flex-1 h-8 rounded-full bg-[#2a3942] px-3 flex items-center text-[12.5px] text-[#8696a0]">
            Message
          </div>
          <Mic className="w-5 h-5 text-[#8696a0]" />
        </div>
      </div>

      {/* Meta + actions */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <code className="font-mono text-[11px] text-slate-400 truncate">{tpl.name}</code>
          <StatusPill
            tone={
              stored?.status === "REJECTED"
                ? "red"
                : stored?.status === "PENDING"
                ? "amber"
                : "emerald"
            }
          >
            {stored?.status === "PENDING"
              ? "Pending"
              : stored?.status === "REJECTED"
              ? "Rejected"
              : "Approved"}
          </StatusPill>
        </div>
        <span className="text-[11px] text-slate-500 shrink-0">{tpl.category}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={copy}
          icon={
            copied ? <Check className="w-3.5 h-3.5 text-[#00a884]" /> : <Copy className="w-3.5 h-3.5" />
          }
        >
          {copied ? "Copied" : "Copy text"}
        </Button>
        <Button
          size="sm"
          variant="brand"
          loading={sendingTest}
          onClick={() => onSendTest(stage)}
          icon={<Send className="w-3.5 h-3.5" />}
        >
          <span>Send test</span>
          {hostPhone && (
            <span className="hidden sm:inline font-mono tabular-nums">
              to {formatPhoneDisplay(hostPhone)}
            </span>
          )}
        </Button>
        <span className="ml-auto hidden xl:flex items-center gap-1 text-[11px] text-slate-600">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </span>
      </div>
    </div>
  );
}
