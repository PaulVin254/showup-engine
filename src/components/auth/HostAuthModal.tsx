"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from "lucide-react";

interface HostAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (message: string) => Promise<void>;
}

const MUSE_INPUT =
  "w-full px-5 py-3.5 rounded-full bg-[#25272c] border border-white/[0.08] text-white text-sm placeholder:text-[#8a909e] focus:outline-none focus:border-[#4589ff] transition";

export function HostAuthModal({
  isOpen,
  onClose,
  onAuthenticated,
}: HostAuthModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMsg(null);
    setDevHint(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/host-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setStatusMsg(data.message);
      if (data.devHint) {
        setDevHint(data.devHint);
      }
      setStep("otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed sending WhatsApp code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/host-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid code");
      await onAuthenticated(data.message || "Welcome back!");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/host-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "load_demo" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed loading demo");
      await onAuthenticated(data.message || "Loaded sample demo room");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed loading demo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#17191e] border border-white/[0.08] rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4589ff]/15 border border-[#4589ff]/30 flex items-center justify-center text-[#4589ff]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                Host WhatsApp Sign In
              </h3>
              <p className="text-xs text-[#8a909e]">
                Zero passwords. Recover your rooms &amp; leads via WhatsApp OTP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8a909e] hover:text-white p-1.5 rounded-full hover:bg-white/[0.06]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {error}
          </div>
        )}

        {statusMsg && (
          <div className="p-3.5 rounded-2xl bg-[#4589ff]/10 border border-[#4589ff]/30 text-[#7db4ff] text-xs space-y-1">
            <div>{statusMsg}</div>
            {devHint && (
              <div className="font-mono text-emerald-300">
                Simulated Dev Code: <strong>{devHint}</strong>
              </div>
            )}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs text-[#9ca3af] mb-2 ml-3">
                Your Host WhatsApp number
              </label>
              <input
                type="tel"
                required
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${MUSE_INPUT} font-mono`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm px-6 py-3.5 transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Send 6-Digit WhatsApp Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 ml-3 mr-2">
                <label className="text-xs text-[#9ca3af]">
                  Enter 6-digit code sent to {phone}
                </label>
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-[11px] text-[#4589ff] hover:underline"
                >
                  Change number
                </button>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className={`${MUSE_INPUT} font-mono text-center tracking-[0.3em] text-base`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#4589ff] hover:bg-[#5896ff] text-white font-medium text-sm px-6 py-3.5 transition"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Verify &amp; Load My Rooms
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-[#8a909e]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Isolated host workspace
          </span>
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={loading}
            className="inline-flex items-center gap-1 text-[#9ca3af] hover:text-white transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4589ff]" />
            Preview Sample Room
          </button>
        </div>
      </div>
    </div>
  );
}

