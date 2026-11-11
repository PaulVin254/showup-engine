"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { ShowUpTenant } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  Button,
  Dialog,
  EASE_OUT_FAST,
  Kbd,
  SPRING_SNAPPY,
  StatusPill,
  inputCls,
  labelCls,
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
  /** Persistent developer mode from Settings. Ctrl+Shift+D toggles per session. */
  devMode?: boolean;
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
  devMode = false,
  onConnected,
}: EmbeddedSignupModalProps) {
  const [devToggle, setDevToggle] = useState(false);
  const [devTab, setDevTab] = useState<"config" | "direct">("config");
  const [appId, setAppId] = useState(defaultAppId || "946759377779936");
  const [configId, setConfigId] = useState(defaultConfigId || "1433645942194259");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const showDev = devMode || devToggle;

  useEffect(() => {
    if (defaultAppId) setAppId(defaultAppId);
    if (defaultConfigId) setConfigId(defaultConfigId);
  }, [defaultAppId, defaultConfigId]);

  const [manualWabaId, setManualWabaId] = useState(tenant.waba_id || "");
  const [manualPhoneId, setManualPhoneId] = useState(tenant.phone_number_id || "");
  const [manualDisplayPhone, setManualDisplayPhone] = useState(tenant.display_phone_number || "");
  const [manualToken, setManualToken] = useState("");

  const addLog = (msg: string, data?: unknown) => {
    const line = `[${new Date().toLocaleTimeString("en-GB", {
      timeZone: "Africa/Nairobi",
    })}] ${msg}`;
    console.log("[ShowUp WhatsApp]", line, data !== undefined ? data : "");
    setLogs((prev) => [...prev.slice(-30), line]);
  };

  // Ctrl+Shift+D → toggle diagnostics (only while the modal is open)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setDevToggle((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    addLog("Embedded Signup opened", { configId, appId, origin: window.location.origin });

    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes("facebook.com") && !event.origin.includes("meta.com")) return;
      addLog(`postMessage from ${event.origin}`, event.data);
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          addLog(`Embedded Signup event: ${data.event}`, data.data);
          if (data.event === "FINISH" && data.data) {
            const { phone_number_id, waba_id } = data.data;
            if (waba_id) {
              sessionStorage.setItem("showup_waba_id", waba_id);
              setManualWabaId(waba_id);
            }
            if (phone_number_id) {
              sessionStorage.setItem("showup_phone_number_id", phone_number_id);
              setManualPhoneId(phone_number_id);
            }
            setStatusMessage("Number verified. Finishing setup…");
            addLog(`Captured WABA ${waba_id} / phone ${phone_number_id}`);
          }
        }
      } catch {
        // ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, configId, appId]);

  const initFbSdk = (targetAppId: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const cleanAppId = targetAppId.trim();
      if (!cleanAppId) {
        const err = "Meta App ID is not configured. Press Ctrl+Shift+D to set it.";
        addLog(`ERROR: ${err}`);
        reject(new Error(err));
        return;
      }
      const initOpts = {
        appId: cleanAppId,
        autoLogAppEvents: true,
        cookie: true,
        xfbml: true,
        version: "v21.0",
      };

      if (window.FB) {
        try {
          window.FB.init(initOpts);
          addLog("FB SDK re-initialised");
          resolve();
          return;
        } catch (initErr) {
          addLog("FB.init error", initErr);
        }
      }

      addLog("Loading Facebook SDK");
      window.fbAsyncInit = function () {
        try {
          window.FB?.init(initOpts);
          addLog("FB SDK ready");
          resolve();
        } catch (e) {
          addLog("fbAsyncInit error", e);
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
        const msg = "Could not load the Facebook SDK. Disable ad blockers and retry.";
        addLog(`ERROR: ${msg}`);
        reject(new Error(msg));
      };
      document.body.appendChild(js);
    });

  const submitCallback = (payload: Record<string, unknown>, okLog: string) =>
    fetch("/api/whatsapp/embedded-signup/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) =>
        res.json().then((data) => {
          if (!res.ok || data.error) throw new Error(data.error || "Connection failed");
          addLog(okLog, data);
          onConnected(data.tenant);
          onClose();
        })
      )
      .catch((err) => {
        const msg = err instanceof Error ? err.message : "Connection failed";
        addLog(`ERROR: ${msg}`);
        setError(msg);
        setStatusMessage(null);
      })
      .finally(() => setLoading(false));

  const launchEmbeddedSignupPopup = () => {
    setError(null);
    setStatusMessage(null);
    const cleanAppId = appId.trim();
    const cleanConfigId = configId.trim();
    if (!cleanAppId) {
      setError("Meta App ID is not configured. Press Ctrl+Shift+D to set it.");
      return;
    }
    addLog("Starting Embedded Signup", { appId: cleanAppId, configId: cleanConfigId });
    setLoading(true);

    initFbSdk(cleanAppId)
      .then(() => {
        if (!window.FB) throw new Error("Facebook SDK not found.");
        const loginOptions = {
          config_id: cleanConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: { sessionInfoVersion: "3", version: "4", featureType: "None" },
            featureType: "",
            sessionInfoVersion: "3",
          },
        };
        addLog("FB.login", loginOptions);
        window.FB.login((response) => {
          addLog("FB.login response", response);
          const code = response?.authResponse?.code;
          if (code) {
            setStatusMessage("Connecting your number and installing templates…");
            submitCallback(
              {
                code,
                wabaId: sessionStorage.getItem("showup_waba_id") || manualWabaId,
                phoneNumberId:
                  sessionStorage.getItem("showup_phone_number_id") || manualPhoneId,
              },
              "Onboarding complete"
            );
          } else {
            setLoading(false);
            addLog("Popup closed before authorisation");
          }
        }, loginOptions);
      })
      .catch((err: unknown) => {
        setLoading(false);
        const msg = err instanceof Error ? err.message : "Could not open Facebook";
        addLog(`CATCH: ${msg}`);
        setError(msg);
      });
  };

  const handleDirectTokenConnect = (sandbox = false) => {
    setError(null);
    setLoading(true);
    const payload = sandbox
      ? {
          wabaId: "waba_ke_demo_99201",
          phoneNumberId: "phone_ke_demo_88120",
          displayPhoneNumber: "+254 712 345 678",
          accessToken: "demo_permanent_system_user_token",
        }
      : {
          wabaId: manualWabaId.trim(),
          phoneNumberId: manualPhoneId.trim(),
          displayPhoneNumber: manualDisplayPhone.trim(),
          accessToken: manualToken.trim(),
        };
    addLog(sandbox ? "Activating sandbox WABA" : "Connecting via system token", {
      ...payload,
      accessToken: "•••",
    });
    submitCallback(payload, "Direct connection complete");
  };

  const hostedUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${encodeURIComponent(
    appId.trim()
  )}&config_id=${encodeURIComponent(configId.trim())}&extras=${encodeURIComponent(
    JSON.stringify({ setup: { sessionInfoVersion: "3", version: "4", featureType: "None" } })
  )}`;

  const connected = tenant.waba_status === "connected";

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Connect WhatsApp Business"
      description="Send reminders from your own verified number."
      width={showDev ? "max-w-lg" : "max-w-[420px]"}
    >
      <div className="space-y-4">
        {/* Status row */}
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

        {/* Developer diagnostics (hidden by default, animated expand/collapse) */}
        <AnimatePresence initial={false}>
          {showDev && (
            <motion.div
              key="dev-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={EASE_OUT_FAST}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-2 border-t border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex p-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[11.5px]">
                    {(
                      [
                        ["config", "Config & logs"],
                        ["direct", "System token"],
                      ] as const
                    ).map(([id, label]) => {
                      const active = devTab === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setDevTab(id)}
                          className={cn(
                            "relative h-6 px-2 rounded transition-colors",
                            active ? "text-white" : "text-slate-500 hover:text-slate-200"
                          )}
                        >
                          {active && (
                            <motion.span
                              layoutId="meta-dev-tab"
                              transition={SPRING_SNAPPY}
                              className="absolute inset-0 rounded bg-white/[0.1]"
                            />
                          )}
                          <span className="relative z-10">{label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span className="flex items-center gap-1 text-[10.5px] text-slate-600">
                    <Kbd>Ctrl</Kbd>
                    <Kbd>Shift</Kbd>
                    <Kbd>D</Kbd>
                  </span>
                </div>

                <AnimatePresence mode="wait" initial={false}>
                  {devTab === "config" ? (
                    <motion.div
                      key="dev-config"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>Config ID</label>
                          <input
                            value={configId}
                            onChange={(e) => setConfigId(e.target.value)}
                            className={cn(inputCls, "font-mono text-[12px]")}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>App ID</label>
                          <input
                            value={appId}
                            onChange={(e) => setAppId(e.target.value)}
                            className={cn(inputCls, "font-mono text-[12px]")}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[11.5px]">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleDirectTokenConnect(true)}
                          className="text-slate-400 hover:text-white underline underline-offset-4"
                        >
                          Activate sandbox WABA
                        </button>
                        <a
                          href={hostedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#5aa2ff] hover:underline"
                        >
                          Meta-hosted URL <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="h-28 overflow-y-auto rounded-md border border-white/[0.08] bg-black/40 p-2.5 font-mono text-[11px] leading-snug text-slate-400 space-y-1">
                        {logs.length === 0 ? (
                          <span className="text-slate-600">Waiting for events…</span>
                        ) : (
                          logs.map((l, i) => (
                            <div key={i} className="break-all">
                              {l}
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="dev-direct"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.14 }}
                      className="space-y-2.5"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className={labelCls}>WABA ID</label>
                          <input
                            value={manualWabaId}
                            onChange={(e) => setManualWabaId(e.target.value)}
                            className={cn(inputCls, "font-mono text-[12px]")}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Phone number ID</label>
                          <input
                            value={manualPhoneId}
                            onChange={(e) => setManualPhoneId(e.target.value)}
                            className={cn(inputCls, "font-mono text-[12px]")}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Display number</label>
                          <input
                            placeholder="+254 712 345 678"
                            value={manualDisplayPhone}
                            onChange={(e) => setManualDisplayPhone(e.target.value)}
                            className={cn(inputCls, "font-mono text-[12px]")}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>System user token</label>
                          <input
                            type="password"
                            placeholder="EAAG…"
                            value={manualToken}
                            onChange={(e) => setManualToken(e.target.value)}
                            className={cn(inputCls, "font-mono text-[12px]")}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          variant="brand"
                          loading={loading}
                          onClick={() => handleDirectTokenConnect(false)}
                        >
                          Connect
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Dialog>
  );
}
