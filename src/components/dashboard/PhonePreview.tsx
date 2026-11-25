"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  BatteryMedium,
  Camera,
  Check,
  CheckCheck,
  ChevronLeft,
  Copy,
  CornerUpLeft,
  Mic,
  MoreVertical,
  Phone,
  Plus,
  Send,
  Signal,
  Video,
  Wifi,
} from "lucide-react";
import { SequenceStage, ShowUpEvent, ShowUpTemplate } from "@/lib/types";
import { renderTemplatePreview } from "@/lib/default-templates";
import { fmtEat } from "@/lib/lifecycle";
import { useNow } from "@/lib/use-now";
import {
  PIPELINE_STAGES,
  stagePreviewValues,
  stageSendAt,
  stageTemplate,
} from "@/lib/pipeline";
import { formatPhoneDisplay } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { Button, Kbd, SPRING_SNAPPY, StatusPill } from "@/components/ui/kit";

/* ------------------------------------------------------------------ */
/* Message primitives for WhatsApp Light Mode                          */
/* ------------------------------------------------------------------ */
function Bubble({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & { variant?: "default" | "muted" }) {
  return (
    <div
      data-slot="bubble"
      data-variant={variant}
      className={cn(
        "inline-block max-w-full rounded-2xl px-3.5 py-2 text-[12.5px] leading-[1.4] shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
        variant === "muted"
          ? "bg-white text-[#111b21] rounded-bl-sm"
          : "bg-[#d9fdd3] text-[#111b21] rounded-br-sm",
        className
      )}
      {...props}
    />
  );
}

function BubbleContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="bubble-content"
      className={cn("whitespace-pre-wrap break-words", className)}
      {...props}
    />
  );
}

function Message({
  className,
  align = "start",
  ...props
}: React.ComponentProps<"div"> & { align?: "start" | "end" }) {
  return (
    <div
      data-slot="message"
      data-align={align}
      className={cn(
        "flex w-full items-end gap-2",
        align === "end" && "flex-row-reverse",
        className
      )}
      {...props}
    />
  );
}

function MessageAvatar({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-avatar"
      className={cn(
        "relative shrink-0 self-end overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  );
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn("flex max-w-[82%] flex-col gap-1", className)}
      {...props}
    />
  );
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 block size-2.5 rounded-full ring-2 ring-[#efeae2]",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const STAGE_REGISTRANT_REPLIES: Record<SequenceStage, string> = {
  instant_welcome: "Got it, thanks! Looking forward to it ✅",
  calendar_link: "Locked it into my calendar 📅",
  t_24h: "YES, I'll be there",
  t_1h: "Phone charged and Wi-Fi ready!",
  live_now: "Joining the room now 🙌",
};

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
            <span key={i} className="text-[#027eb5] break-all">
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
  const liveNow = useNow(15_000);
  const [copied, setCopied] = useState(false);
  const [replyTick, setReplyTick] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const tablistRef = useRef<HTMLDivElement>(null);

  const idx = PIPELINE_STAGES.findIndex((s) => s.key === stage);
  const meta = PIPELINE_STAGES[idx];
  const tpl = stageTemplate(stage);
  const stored = templates.find((t) => t.name === tpl.name);
  const body = renderTemplatePreview(tpl.body_text, stagePreviewValues(stage, event, origin));
  const sendAt = stageSendAt(meta, event) ?? new Date(event.created_at).getTime();
  const registrantReply =
    stage === "t_24h" && tpl.button_text ? tpl.button_text : STAGE_REGISTRANT_REPLIES[stage];

  const selectStage = (nextStage: SequenceStage) => {
    const nextIdx = PIPELINE_STAGES.findIndex((s) => s.key === nextStage);
    setDirection(nextIdx >= idx ? 1 : -1);
    onStageChange(nextStage);
  };

  useEffect(() => {
    setReplyTick(0);
  }, [stage, event.id]);

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

  const displaySender = senderName || "ShowUp Verified";
  const initials = displaySender
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-[24px] bg-[#f4f4f5] border border-neutral-200/80 p-3.5 sm:p-4 flex flex-col">
      {/* Pill Scrubber */}
      <div
        ref={tablistRef}
        role="tablist"
        aria-label="Message stage"
        className="grid grid-cols-5 gap-1 p-1 rounded-full bg-white border border-neutral-200"
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
                "relative h-7 rounded-full text-[11px] font-medium transition-colors flex items-center justify-center gap-1",
                active ? "text-white" : "text-neutral-500 hover:text-[#111111]"
              )}
            >
              {active && (
                <motion.span
                  layoutId="scrubber-pill"
                  transition={SPRING_SNAPPY}
                  className="absolute inset-0 rounded-full bg-[#111111] shadow-xs"
                />
              )}
              <span className="relative z-10 font-mono tabular-nums opacity-75">{s.step}</span>
              <span className="relative z-10 hidden xl:inline truncate">
                {s.label.split(" ")[0]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Light-mode WhatsApp iPhone Frame */}
      <div className="relative mt-4 mx-auto w-full max-w-[344px] px-2 select-none">
        <div className="relative mx-auto w-full border-[9px] border-[#111111] bg-white rounded-[42px] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.22)]">
          {/* Inner screen */}
          <div className="w-full rounded-[33px] overflow-hidden bg-[#efeae2] flex flex-col">
            {/* Status Bar + Notch */}
            <div className="relative h-8 z-20 px-5 flex justify-between items-center text-[#111111] bg-white">
              <div className="text-[11px] font-semibold font-mono tabular-nums flex items-center">
                <Signal className="w-3.5 h-3.5 mr-1" />
                {fmtEat(liveNow)}
              </div>

              <div
                aria-hidden
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[42%] h-[20px] bg-[#111111] rounded-b-xl z-30 flex justify-center items-center space-x-2 p-1"
              >
                <div className="w-9 h-1 rounded-full bg-neutral-700" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-700" />
              </div>

              <div className="text-xs font-semibold flex items-center">
                <Wifi className="w-3.5 h-3.5 mr-1" />
                <BatteryMedium className="w-5 h-5" />
              </div>
            </div>

            {/* WhatsApp Business Header (Light Mode) */}
            <div className="bg-white px-2.5 py-2 flex items-center gap-2 border-b border-neutral-200/80">
              <ChevronLeft className="w-5 h-5 text-neutral-600 -ml-1 shrink-0" />
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-[11px] font-semibold text-white shrink-0">
                {initials || "SU"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="text-[13.5px] font-semibold text-[#111111] truncate">
                    {displaySender}
                  </span>
                  <BadgeCheck
                    className="w-[14px] h-[14px] text-[#00a884] shrink-0"
                    fill="#00a884"
                    stroke="#ffffff"
                  />
                </div>
                <div className="text-[10.5px] text-neutral-500 truncate">
                  {senderPhone ? formatPhoneDisplay(senderPhone) : "Official business account"}
                </div>
              </div>
              <Video className="w-[17px] h-[17px] text-neutral-600 shrink-0" />
              <Phone className="w-[15px] h-[15px] text-neutral-600 shrink-0" />
              <MoreVertical className="w-[15px] h-[15px] text-neutral-600 shrink-0" />
            </div>

            {/* WhatsApp Chat Canvas */}
            <div className="wa-wallpaper min-h-[372px] px-2.5 py-3.5 flex flex-col gap-3 overflow-hidden">
              <div className="self-center px-2.5 py-0.5 rounded-full bg-white/90 border border-black/5 text-[10.5px] text-neutral-600 font-medium shadow-xs">
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
                  className="flex flex-col gap-3"
                >
                  <Message align="start">
                    <MessageAvatar className="overflow-visible">
                      <div className="w-7 h-7 rounded-full bg-[#00a884] flex items-center justify-center text-[10px] font-semibold text-white">
                        {initials || "SU"}
                      </div>
                      <AvatarBadge className="bg-[#25d366]">
                        <span className="sr-only">Online</span>
                      </AvatarBadge>
                    </MessageAvatar>

                    <MessageContent>
                      <Bubble variant="muted">
                        <BubbleContent>
                          <WaText text={body} />
                        </BubbleContent>
                        <div className="text-right text-[10px] text-neutral-400 mt-1 font-mono tabular-nums">
                          {fmtEat(sendAt)}
                        </div>
                      </Bubble>

                      {tpl.button_type === "QUICK_REPLY" && tpl.button_text && (
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.985 }}
                          onClick={() => setReplyTick((n) => n + 1)}
                          title="Tap to replay registrant quick reply"
                          className="w-full rounded-xl bg-white hover:bg-neutral-50 border border-black/5 py-2 px-3 text-center text-[12px] font-medium text-[#027eb5] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <CornerUpLeft className="w-3.5 h-3.5 shrink-0" />
                          <span>{tpl.button_text}</span>
                        </motion.button>
                      )}
                    </MessageContent>
                  </Message>

                  <motion.div
                    key={`reply-${stage}-${replyTick}`}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={SPRING_SNAPPY}
                    className="flex flex-col gap-1"
                  >
                    <Message align="end">
                      <MessageAvatar>
                        <div className="w-7 h-7 rounded-full bg-white border border-neutral-200 flex items-center justify-center text-[10px] font-semibold text-[#111111]">
                          WK
                        </div>
                      </MessageAvatar>

                      <MessageContent className="items-end">
                        <Bubble variant="default">
                          <BubbleContent>{registrantReply}</BubbleContent>
                          <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-neutral-500 font-mono tabular-nums">
                            <span>{fmtEat(liveNow)}</span>
                            <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                          </div>
                        </Bubble>
                      </MessageContent>
                    </Message>
                    <div className="text-[10.5px] text-right pr-9 text-neutral-500">Delivered</div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Light WhatsApp composer bar */}
            <div className="bg-[#f0f2f5] px-2.5 py-2 flex items-center gap-2 border-t border-neutral-200/70">
              <Plus className="w-5 h-5 text-neutral-500 shrink-0" />
              <div className="flex-1 h-8 rounded-full bg-white border border-neutral-200/70 px-3 flex items-center justify-between text-[12px] text-neutral-400">
                <span>Message</span>
                <Camera className="w-4 h-4 text-neutral-400" />
              </div>
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shrink-0">
                <Mic className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-[#f0f2f5] pt-0.5 pb-2 flex justify-center">
              <span className="w-24 h-1 rounded-full bg-neutral-400/60" />
            </div>
          </div>
        </div>
      </div>

      {/* Meta + actions */}
      <div className="mt-4 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex items-center gap-2">
          <code className="font-mono text-[11px] text-neutral-600 truncate">{tpl.name}</code>
          <StatusPill
            tone={
              stored?.status === "REJECTED"
                ? "red"
                : stored?.status === "PENDING"
                ? "amber"
                : "emerald"
            }
            pulse={stored?.status === "PENDING"}
          >
            {stored?.status === "PENDING"
              ? "In Meta review"
              : stored?.status === "REJECTED"
              ? "Rejected"
              : "Approved"}
          </StatusPill>
        </div>
        <span className="text-[11px] text-neutral-500 shrink-0">{tpl.category}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          className="bg-white border-neutral-200"
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
        <span className="ml-auto hidden xl:flex items-center gap-1 text-[11px] text-neutral-400">
          <Kbd>←</Kbd>
          <Kbd>→</Kbd>
        </span>
      </div>
    </div>
  );
}
