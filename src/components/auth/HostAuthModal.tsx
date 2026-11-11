"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { normalizeKenyanPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { Button, Dialog, EASE_OUT_FAST, inputCls, labelCls } from "@/components/ui/kit";

interface HostAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (message: string) => Promise<void>;
}

export function HostAuthModal({ isOpen, onClose, onAuthenticated }: HostAuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  const normalized = normalizeKenyanPhone(phone);

  const call = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/auth/host-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  };

  const run = async (fn: () => Promise<void>) => {
    setError(null);
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const data = await call({ action: "send_otp", phone });
      setDevHint(data.devHint || null);
      setStep("otp");
    });
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    return run(async () => {
      const data = await call({ action: "verify_otp", phone, code });
      await onAuthenticated(data.message || "Signed in");
      onClose();
    });
  };

  const loadDemo = () =>
    run(async () => {
      const data = await call({ action: "load_demo" });
      await onAuthenticated(data.message || "Sample data loaded");
      onClose();
    });

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Sign in"
      description="We'll send a 6-digit code to your WhatsApp."
      width="max-w-sm"
      footer={
        <>
          <span className="text-[11.5px] text-slate-500">No password needed</span>
          <button
            type="button"
            onClick={loadDemo}
            disabled={loading}
            className="text-[12px] text-slate-400 hover:text-white underline underline-offset-4 transition disabled:opacity-50"
          >
            Load sample data
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="auth-err"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={EASE_OUT_FAST}
              className="px-3 py-2.5 rounded-md border border-red-500/25 bg-red-500/[0.06] text-[12.5px] text-red-300"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" initial={false}>
          {step === "phone" ? (
            <motion.form
              key="step-phone"
              onSubmit={sendOtp}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={EASE_OUT_FAST}
              className="space-y-4"
            >
              <div>
                <label className={labelCls}>WhatsApp number</label>
                <input
                  required
                  autoFocus
                  type="tel"
                  placeholder="0712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    inputCls,
                    "font-mono tabular-nums",
                    phone.length > 3 && !normalized && "border-red-500/60"
                  )}
                />
                <div className="mt-1 h-3.5 text-[10.5px] font-mono tabular-nums text-slate-500">
                  {normalized ? `→ +${normalized}` : ""}
                </div>
              </div>
              <Button
                type="submit"
                variant="brand"
                className="w-full"
                loading={loading}
                disabled={!normalized}
              >
                Send code
              </Button>
            </motion.form>
          ) : (
            <motion.form
              key="step-otp"
              onSubmit={verifyOtp}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 14 }}
              transition={EASE_OUT_FAST}
              className="space-y-4"
            >
              <div>
                <div className="flex items-center justify-between">
                  <label className={labelCls}>Code sent to +{normalized}</label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setCode("");
                    }}
                    className="text-[11.5px] text-[#5aa2ff] hover:underline mb-1.5"
                  >
                    Change
                  </button>
                </div>
                <input
                  required
                  autoFocus
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={cn(
                    inputCls,
                    "h-11 text-center font-mono tabular-nums text-lg tracking-[0.4em]"
                  )}
                />
                {devHint && (
                  <div className="mt-1.5 text-[11px] font-mono text-slate-500">
                    Dev code: <span className="text-slate-300">{devHint}</span>
                  </div>
                )}
              </div>
              <Button
                type="submit"
                variant="brand"
                className="w-full"
                loading={loading}
                disabled={code.length < 6}
              >
                Verify and continue
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
