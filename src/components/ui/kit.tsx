"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Tokens & Motion Presets                                             */
/* ------------------------------------------------------------------ */
export const HAIRLINE = "border-white/[0.08]";

export const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

export const SPRING_PANEL = {
  type: "spring" as const,
  stiffness: 360,
  damping: 34,
  mass: 0.9,
};

export const EASE_OUT_FAST = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

export const inputCls =
  "w-full h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.08] text-[13px] text-white placeholder:text-slate-500 outline-none transition focus:border-[#1877f2] focus:ring-2 focus:ring-[#1877f2]/25 disabled:opacity-50";

export const labelCls = "block text-[12px] font-medium text-slate-400 mb-1.5";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
type ButtonVariant = "brand" | "secondary" | "ghost" | "success";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  brand: "bg-[#1877f2] text-white hover:bg-[#2e86f8] border border-transparent",
  success: "bg-[#00a884] text-white hover:bg-[#00b894] border border-transparent",
  secondary:
    "bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] border border-white/[0.08]",
  ghost:
    "bg-transparent text-slate-400 hover:text-white hover:bg-white/[0.06] border border-transparent",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "secondary",
      size = "md",
      loading,
      icon,
      className,
      children,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877f2]/50",
          size === "sm" ? "h-7 px-2.5 text-[12px]" : "h-9 px-3.5 text-[13px]",
          BUTTON_VARIANTS[variant],
          className
        )}
        {...rest}
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

/* ------------------------------------------------------------------ */
/* StatusPill                                                          */
/* ------------------------------------------------------------------ */
export type Tone = "emerald" | "blue" | "slate" | "amber" | "red";

const TONES: Record<Tone, { pill: string; dot: string }> = {
  emerald: { pill: "text-[#00a884] bg-[#00a884]/10 border-[#00a884]/25", dot: "bg-[#00a884]" },
  blue: { pill: "text-[#5aa2ff] bg-[#1877f2]/10 border-[#1877f2]/25", dot: "bg-[#1877f2]" },
  slate: { pill: "text-slate-400 bg-white/[0.04] border-white/[0.08]", dot: "bg-slate-500" },
  amber: { pill: "text-amber-300 bg-amber-400/10 border-amber-400/25", dot: "bg-amber-400" },
  red: { pill: "text-red-300 bg-red-500/10 border-red-500/25", dot: "bg-red-500" },
};

export function StatusPill({
  tone = "slate",
  dot = true,
  pulse,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 h-5 px-2 rounded-full border text-[11px] font-medium leading-none whitespace-nowrap",
        t.pill,
        className
      )}
    >
      {dot && (
        <span className="relative flex w-1.5 h-1.5">
          {pulse && (
            <span className={cn("absolute inset-0 rounded-full opacity-60 animate-ping", t.dot)} />
          )}
          <span className={cn("relative w-1.5 h-1.5 rounded-full", t.dot)} />
        </span>
      )}
      {children}
    </span>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center h-[18px] px-1.5 rounded border border-white/[0.1] bg-white/[0.04] font-mono text-[10px] text-slate-400">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Overlay primitives (Framer Motion AnimatePresence)                  */
/* ------------------------------------------------------------------ */
function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  headerExtra,
  footer,
  width = "max-w-md",
  children,
}: OverlayProps & { width?: string }) {
  useOverlay(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <motion.div
            key="dialog-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            key="dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            layout
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={SPRING_PANEL}
            className={cn(
              "relative w-full my-auto rounded-xl border bg-[#0f1115] shadow-[0_24px_80px_-12px_rgba(0,0,0,0.8)] overflow-hidden",
              HAIRLINE,
              width
            )}
          >
            <div className={cn("flex items-start justify-between gap-4 px-5 py-4 border-b", HAIRLINE)}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-white tracking-tight">{title}</h2>
                  {headerExtra}
                </div>
                {description && <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 -mr-1 rounded text-slate-500 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
            {footer && (
              <div
                className={cn(
                  "px-5 py-3 border-t flex items-center justify-between gap-3 bg-white/[0.015] rounded-b-xl",
                  HAIRLINE
                )}
              >
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  headerExtra,
  footer,
  width = "max-w-xl",
  children,
}: OverlayProps & { width?: string }) {
  useOverlay(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40">
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            key="sheet-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING_PANEL}
            className={cn(
              "absolute right-0 top-0 h-full w-full flex flex-col bg-[#0f1115] border-l shadow-2xl",
              HAIRLINE,
              width
            )}
          >
            <div
              className={cn(
                "flex items-start justify-between gap-4 px-5 py-4 border-b shrink-0",
                HAIRLINE
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-white tracking-tight">{title}</h2>
                  {headerExtra}
                </div>
                {description && <p className="text-[12px] text-slate-400 mt-0.5">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 -mr-1 rounded text-slate-500 hover:text-white hover:bg-white/[0.06] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && (
              <div
                className={cn(
                  "px-5 py-3 border-t shrink-0 flex items-center justify-between gap-3",
                  HAIRLINE
                )}
              >
                {footer}
              </div>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Toasts (Framer Motion layout + AnimatePresence)                     */
/* ------------------------------------------------------------------ */
export interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.button
            layout
            key={t.id}
            type="button"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={SPRING_SNAPPY}
            onClick={() => onDismiss(t.id)}
            className={cn(
              "pointer-events-auto max-w-sm flex items-start gap-2.5 text-left rounded-lg border bg-[#16181d] px-3.5 py-2.5 shadow-xl text-[12.5px] text-slate-200",
              HAIRLINE
            )}
          >
            <span
              className={cn(
                "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                t.tone === "success" && "bg-[#00a884]",
                t.tone === "error" && "bg-red-500",
                t.tone === "info" && "bg-[#1877f2]"
              )}
            />
            <span className="leading-snug">{t.message}</span>
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small layout helpers                                                */
/* ------------------------------------------------------------------ */
export function SectionLabel({
  children,
  right,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 h-9 px-4 border-b border-white/[0.08]">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
        {children}
      </h3>
      {right}
    </div>
  );
}
