"use client";

import React, { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ */
/* Tokens & Motion Presets (Mobbin + shadcn Light System)              */
/* ------------------------------------------------------------------ */
export const HAIRLINE = "border-neutral-200";

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
  "w-full h-9 px-3 rounded-lg bg-white border border-neutral-200 text-[13px] text-[#111111] placeholder:text-neutral-400 outline-none transition focus:border-[#111111] focus:ring-2 focus:ring-neutral-900/10 disabled:opacity-50";

export const labelCls = "block text-[12px] font-medium text-neutral-600 mb-1.5";

/* ------------------------------------------------------------------ */
/* Button                                                              */
/* ------------------------------------------------------------------ */
type ButtonVariant = "brand" | "secondary" | "ghost" | "success" | "danger";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  brand: "bg-[#111111] text-white hover:bg-neutral-800 border border-transparent",
  success: "bg-[#00a884] text-white hover:bg-[#009675] border border-transparent",
  danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200",
  secondary:
    "bg-[#f4f4f5] text-[#111111] hover:bg-neutral-200/80 border border-neutral-200",
  ghost:
    "bg-transparent text-neutral-600 hover:text-[#111111] hover:bg-neutral-100 border border-transparent",
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
          "inline-flex items-center justify-center gap-1.5 rounded-full font-medium whitespace-nowrap transition active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20",
          size === "sm" ? "h-7 px-3 text-[12px]" : "h-9 px-4 text-[13px]",
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
  emerald: {
    pill: "text-emerald-800 bg-emerald-50 border-emerald-200",
    dot: "bg-[#00a884]",
  },
  blue: {
    pill: "text-blue-700 bg-blue-50 border-blue-200",
    dot: "bg-[#1877f2]",
  },
  slate: {
    pill: "text-neutral-600 bg-[#f4f4f5] border-neutral-200",
    dot: "bg-neutral-400",
  },
  amber: {
    pill: "text-amber-800 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  red: {
    pill: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
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
        "inline-flex items-center gap-1.5 h-5 px-2.5 rounded-full border text-[11px] font-medium leading-none whitespace-nowrap",
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
    <kbd className="inline-flex items-center h-[18px] px-1.5 rounded border border-neutral-200 bg-[#f4f4f5] font-mono text-[10px] text-neutral-600">
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
            className="fixed inset-0 bg-black/35 backdrop-blur-[2px]"
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
              "relative w-full my-auto rounded-2xl border bg-white text-[#111111] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.18)] overflow-hidden",
              HAIRLINE,
              width
            )}
          >
            <div className={cn("flex items-start justify-between gap-4 px-5 py-4 border-b", HAIRLINE)}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-[#111111] tracking-tight">
                    {title}
                  </h2>
                  {headerExtra}
                </div>
                {description && (
                  <p className="text-[12px] text-neutral-500 mt-0.5">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 -mr-1 rounded-full text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-5">{children}</div>
            {footer && (
              <div
                className={cn(
                  "px-5 py-3 border-t flex items-center justify-between gap-3 bg-[#fafafa] rounded-b-2xl",
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
            className="absolute inset-0 bg-black/30 backdrop-blur-[1px]"
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
              "absolute right-0 top-0 h-full w-full flex flex-col bg-white text-[#111111] border-l shadow-2xl",
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
                  <h2 className="text-[14px] font-semibold text-[#111111] tracking-tight">
                    {title}
                  </h2>
                  {headerExtra}
                </div>
                {description && (
                  <p className="text-[12px] text-neutral-500 mt-0.5">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="p-1 -mr-1 rounded-full text-neutral-400 hover:text-[#111111] hover:bg-neutral-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && (
              <div
                className={cn(
                  "px-5 py-3 border-t bg-[#fafafa] shrink-0 flex items-center justify-between gap-3",
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
            className="pointer-events-auto max-w-sm flex items-start gap-2.5 text-left rounded-full border border-neutral-800 bg-[#111111] px-4 py-2.5 shadow-lg text-[12.5px] text-white"
          >
            <span
              className={cn(
                "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                t.tone === "success" && "bg-[#25d366]",
                t.tone === "error" && "bg-red-400",
                t.tone === "info" && "bg-blue-400"
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
    <div className="flex items-center justify-between gap-3 h-9 px-4 bg-[#fafafa] border-b border-neutral-200">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
        {children}
      </h3>
      {right}
    </div>
  );
}
