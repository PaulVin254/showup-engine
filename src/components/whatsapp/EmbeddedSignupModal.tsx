"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { ShowUpTenant } from "@/lib/types";
import {
  Button,
  Dialog,
  EASE_OUT_FAST,
  StatusPill,
} from "@/components/ui/kit";

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (params: Record<string, unknown>) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>
      ) => void;
    };
  }
}

interface EmbeddedSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: ShowUpTenant;
  defaultConfigId: string;
  defaultAppId: string;
  onConnected: (updatedTenant: ShowUpTenant) => void;
}

function FacebookGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden>
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.7 4.53-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
    </svg>
  );
}

export function EmbeddedSignupModal({
  isOpen,
  onClose,
  tenant,
  defaultConfigId,
  defaultAppId,
  onConnected,
}: EmbeddedSignupModalProps) {
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wabaIdRef = useRef<string>(tenant.waba_id || "");
  const phoneNumberIdRef = useRef<string>(tenant.phone_number_id || "");

  const appId = (defaultAppId || "946759377779936").trim();
  const configId = (defaultConfigId || "1433645942194259").trim();

  useEffect(() => {
    wabaIdRef.current = tenant.waba_id || "";
    phoneNumberIdRef.current = tenant.phone_number_id || "";
  }, [tenant.waba_id, tenant.phone_number_id]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes("facebook.com") && !event.origin.includes("meta.com")) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP" && data.event === "FINISH" && data.data) {
          const { phone_number_id, waba_id } = data.data;
          if (waba_id) wabaIdRef.current = String(waba_id);
          if (phone_number_id) phoneNumberIdRef.current = String(phone_number_id);
          setStatusMessage("Number verified. Finishing setup…");
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen]);

  const initFbSdk = (targetAppId: string): Promise<void> =>
    new Promise((resolve, reject) => {
      if (!targetAppId) {
        reject(new Error("WhatsApp connection is temporarily unavailable. Please contact support."));
        return;
      }
      const initOpts = {
        appId: targetAppId,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: true,
        version: "v21.0",
      };

      if (window.FB) {
        try {
          window.FB.init(initOpts);
          resolve();
          return;
        } catch {
          // Fall through to reload SDK if existing instance failed init
        }
      }

      window.fbAsyncInit = function () {
        try {
          window.FB?.init(initOpts);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      document.getElementById("facebook-jssdk")?.remove();
      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;
      js.defer = true;
      js.onerror = () => {
        reject(new Error("Could not load the Facebook SDK. Disable ad blockers and retry."));
      };
      document.body.appendChild(js);
    });

  const submitCallback = (payload: Record<string, unknown>) =>
    fetch("/api/whatsapp/embedded-signup/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        res.json().then((data) => {
          if (!res.ok || data.error) throw new Error(data.error || "Connection failed");
          onConnected(data.tenant);
          onClose();
        })
      )
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Connection failed");
        setStatusMessage(null);
      })
      .finally(() => setLoading(false));

  const launchEmbeddedSignupPopup = () => {
    setError(null);
    setStatusMessage(null);
    if (!appId) {
      setError("WhatsApp connection is temporarily unavailable. Please contact support.");
      return;
    }
    setLoading(true);

    initFbSdk(appId)
      .then(() => {
        if (!window.FB) throw new Error("Facebook SDK not found.");
        const loginOptions = {
          config_id: configId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: { sessionInfoVersion: "3", version: "4", featureType: "None" },
            featureType: "",
            sessionInfoVersion: "3",
          },
        };
        window.FB.login((response) => {
          const code = response?.authResponse?.code;
          if (code) {
            setStatusMessage("Connecting your number and installing templates…");
            submitCallback({
              code,
              wabaId: wabaIdRef.current,
              phoneNumberId: phoneNumberIdRef.current,
            });
          } else {
            setLoading(false);
          }
        }, loginOptions);
      })
      .catch((err: unknown) => {
        setLoading(false);
        setError(err instanceof Error ? err.message : "Could not open Facebook");
      });
  };

  const connected = tenant.waba_status === "connected";

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Connect WhatsApp Business"
      description="Send reminders from your own verified number."
      width="max-w-[420px]"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between h-10 px-3 rounded-md border border-white/[0.08] bg-white/[0.02]">
          <span className="text-[12.5px] text-slate-400">Status</span>
          {loading ? (
            <StatusPill tone="blue" pulse>
              Connecting
            </StatusPill>
          ) : connected ? (
            <span className="flex items-center gap-2">
              <span className="font-mono tabular-nums text-[12px] text-slate-300">
                {tenant.display_phone_number || tenant.phone_number_id}
              </span>
              <StatusPill tone="emerald">Verified</StatusPill>
            </span>
          ) : (
            <StatusPill tone="slate">Not connected</StatusPill>
          )}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="err"
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
          {statusMessage && !error && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={EASE_OUT_FAST}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md border border-[#1877f2]/25 bg-[#1877f2]/[0.06] text-[12.5px] text-[#8fbfff]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {statusMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="brand"
          className="w-full h-10 text-[13.5px]"
          loading={loading}
          onClick={launchEmbeddedSignupPopup}
          icon={<FacebookGlyph />}
        >
          {connected ? "Reconnect with Facebook" : "Continue with Facebook"}
        </Button>

        <p className="text-[12px] text-slate-500 text-center leading-relaxed">
          Choose your business and number in the Meta window. ShowUp then installs your five
          reminder templates.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="block mx-auto text-[12px] text-slate-500 hover:text-white underline underline-offset-4 transition"
        >
          Keep using the ShowUp number
        </button>
      </div>
    </Dialog>
  );
}
