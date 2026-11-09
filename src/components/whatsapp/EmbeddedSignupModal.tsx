"use client";

import React, { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import { ShowUpTenant } from "@/lib/types";

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

export function EmbeddedSignupModal({
  isOpen,
  onClose,
  tenant,
  defaultConfigId,
  defaultAppId,
  onConnected,
}: EmbeddedSignupModalProps) {
  const [showDevTools, setShowDevTools] = useState(false);
  const [devTab, setDevTab] = useState<"config" | "direct">("config");
  const [appId, setAppId] = useState(defaultAppId || "946759377779936");
  const [configId, setConfigId] = useState(defaultConfigId || "1433645942194259");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Sync defaults if parent state updates from /api/state
  useEffect(() => {
    if (defaultAppId) setAppId(defaultAppId);
    if (defaultConfigId) setConfigId(defaultConfigId);
  }, [defaultAppId, defaultConfigId]);

  // Direct / Developer token inputs
  const [manualWabaId, setManualWabaId] = useState(tenant.waba_id || "");
  const [manualPhoneId, setManualPhoneId] = useState(tenant.phone_number_id || "");
  const [manualDisplayPhone, setManualDisplayPhone] = useState(
    tenant.display_phone_number || "+254 712 345 678"
  );
  const [manualToken, setManualToken] = useState("");

  const addLog = (msg: string, data?: unknown) => {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${msg}`;
    console.log(
      `%c[ShowUp WhatsApp]%c ${line}`,
      "background: #25D366; color: #022c22; font-weight: bold; border-radius: 3px; padding: 1px 5px;",
      "color: #38bdf8;",
      data !== undefined ? data : ""
    );
    setLogs((prev) => [...prev.slice(-30), line]);
  };

  useEffect(() => {
    if (!isOpen) return;

    addLog("Embedded Signup Modal opened", {
      configId,
      appId,
      origin: window.location.origin,
    });

    const handleMessage = (event: MessageEvent) => {
      if (
        !event.origin.includes("facebook.com") &&
        !event.origin.includes("meta.com")
      ) {
        return;
      }
      addLog(`Received postMessage from ${event.origin}`, event.data);

      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;

        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          addLog(`Embedded Signup Event: ${data.event}`, data.data);

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

            const captured = `Verified WABA (${waba_id}) & Phone ID (${phone_number_id})`;
            setStatusMessage(captured);
            addLog(`SUCCESS: ${captured}`);
          }
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen, configId, appId]);

  const initFbSdk = (targetAppId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cleanAppId = targetAppId.trim();
      if (!cleanAppId) {
        const err = "Meta App ID is missing. Open Developer Diagnostics to configure.";
        addLog(`ERROR: ${err}`);
        reject(new Error(err));
        return;
      }

      if (window.FB) {
        addLog("window.FB already loaded, re-initializing...", { appId: cleanAppId });
        try {
          window.FB.init({
            appId: cleanAppId,
            autoLogAppEvents: true,
            cookie: true,
            xfbml: true,
            version: "v21.0",
          });
          addLog("FB SDK initialized successfully");
          resolve();
          return;
        } catch (initErr) {
          addLog("FB.init error:", initErr);
        }
      }

      addLog("Injecting https://connect.facebook.net/en_US/sdk.js into DOM...");

      window.fbAsyncInit = function () {
        addLog("window.fbAsyncInit triggered by Meta SDK");
        try {
          window.FB?.init({
            appId: cleanAppId,
            autoLogAppEvents: true,
            cookie: true,
            xfbml: true,
            version: "v21.0",
          });
          addLog("FB SDK init complete via fbAsyncInit");
          resolve();
        } catch (e) {
          addLog("Error inside fbAsyncInit:", e);
          reject(e);
        }
      };

      const existing = document.getElementById("facebook-jssdk");
      if (existing) {
        existing.remove();
      }

      const js = document.createElement("script");
      js.id = "facebook-jssdk";
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      js.async = true;
      js.defer = true;
      js.onerror = () => {
        const msg = "Could not load Facebook SDK script. Check if an adblocker is active.";
        addLog(`ERROR: ${msg}`);
        reject(new Error(msg));
      };
      document.body.appendChild(js);
    });
  };

  const launchEmbeddedSignupPopup = () => {
    setError(null);
    setStatusMessage(null);

    const cleanAppId = appId.trim();
    const cleanConfigId = configId.trim();

    if (!cleanAppId) {
      const msg = "Meta App ID is not configured. Open Developer Diagnostics below.";
      setError(msg);
      addLog(`VALIDATION: ${msg}`);
      return;
    }

    addLog("Starting Embedded Signup launch flow...", {
      appId: cleanAppId,
      configId: cleanConfigId,
    });
    setLoading(true);

    initFbSdk(cleanAppId)
      .then(() => {
        if (!window.FB) {
          throw new Error("Facebook JS SDK not found on window object.");
        }

        const loginOptions = {
          config_id: cleanConfigId,
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {
              sessionInfoVersion: "3",
              version: "4",
              featureType: "None",
            },
            featureType: "",
            sessionInfoVersion: "3",
          },
        };

        addLog("Calling window.FB.login with options:", loginOptions);

        window.FB.login(
          function (response) {
            addLog("FB.login response received:", response);

            if (response && response.authResponse && response.authResponse.code) {
              const code = response.authResponse.code;
              const wabaId =
                sessionStorage.getItem("showup_waba_id") || manualWabaId;
              const phoneNumberId =
                sessionStorage.getItem("showup_phone_number_id") || manualPhoneId;

              addLog("Auth Code captured successfully:", {
                codeLength: code.length,
                wabaId,
                phoneNumberId,
              });

              setStatusMessage(
                "Completing WhatsApp Business verification & provisioning your 5 webinar templates..."
              );

              fetch("/api/whatsapp/embedded-signup/callback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  code,
                  wabaId,
                  phoneNumberId,
                }),
              })
                .then(function (res) {
                  return res.json().then(function (data) {
                    if (!res.ok || data.error) {
                      throw new Error(data.error || "Failed onboarding WABA");
                    }
                    addLog("Backend onboarding complete!", data);
                    onConnected(data.tenant);
                    onClose();
                  });
                })
                .catch(function (err) {
                  const errorMsg =
                    err instanceof Error ? err.message : "Failed completing callback";
                  addLog(`ERROR: ${errorMsg}`);
                  setError(errorMsg);
                })
                .finally(function () {
                  setLoading(false);
                });
            } else {
              setLoading(false);
              const cancelMsg = "Facebook window closed before authorization completed.";
              addLog(`INFO: ${cancelMsg}`);
              setStatusMessage(cancelMsg);
            }
          },
          loginOptions
        );
      })
      .catch((err: unknown) => {
        setLoading(false);
        const errMsg = err instanceof Error ? err.message : "Failed launching popup";
        addLog(`CATCH: ${errMsg}`);
        setError(errMsg);
      });
  };

  const handleDirectTokenConnect = (useSandboxDemo = false) => {
    setError(null);
    setLoading(true);

    const payload = useSandboxDemo
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

    addLog(
      useSandboxDemo
        ? "Activating Sandbox Demo WABA..."
        : "Connecting via Direct System Token...",
      payload
    );

    fetch("/api/whatsapp/embedded-signup/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok || data.error) {
            throw new Error(data.error || "Connection failed");
          }
          addLog("Direct token connection successful!", data);
          onConnected(data.tenant);
          onClose();
        });
      })
      .catch(function (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        addLog(`ERROR: ${msg}`);
        setError(msg);
      })
      .finally(function () {
        setLoading(false);
      });
  };

  const directMetaHostedUrl = `https://business.facebook.com/messaging/whatsapp/onboard/?app_id=${encodeURIComponent(
    appId.trim()
  )}&config_id=${encodeURIComponent(
    configId.trim()
  )}&extras=${encodeURIComponent(
    JSON.stringify({
      setup: {
        sessionInfoVersion: "3",
        version: "4",
        featureType: "None",
      },
    })
  )}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#12141a] border border-white/[0.08] rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0d0f12]/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1877f2]/15 border border-[#1877f2]/30 flex items-center justify-center text-[#1877f2]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">
                Connect Your WhatsApp Business Number
              </h3>
              <p className="text-xs text-slate-400">
                Official Meta Cloud API · Zero Ban Risk · Auto-Template Setup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/[0.08]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer-Ready 1-Click Onboarding Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-[#1877f2]/10 border border-[#1877f2]/30 text-[#7db4ff] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* 3-Step Visual Onboarding Guide */}
          <div className="rounded-2xl bg-[#0d0f12] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                Official Meta Tech Provider Onboarding
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                ~60 seconds
              </span>
            </div>

            <ol className="space-y-3 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1877f2]/20 text-[#60a5fa] font-mono text-[11px] font-bold mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-medium text-white">Log in with Facebook</span>{" "}
                  and select your Meta Business Portfolio in the secure Meta popup.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1877f2]/20 text-[#60a5fa] font-mono text-[11px] font-bold mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-medium text-white">Select or verify your WhatsApp number</span>{" "}
                  that will appear on your attendees&apos; phones.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1877f2]/20 text-[#60a5fa] font-mono text-[11px] font-bold mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-medium text-white">Automatic 5-Stage Template Provisioning:</span>{" "}
                  ShowUp automatically installs your 5 East Africa Time (EAT) webinar reminder templates.
                </div>
              </li>
            </ol>

            <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-white/[0.06] text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#00a884]" />
                No coding or API keys needed
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#00a884]" />
                Disconnect anytime
              </span>
            </div>
          </div>

          {/* Primary 1-Click Action Button */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={launchEmbeddedSignupPopup}
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white bg-[#1877f2] hover:bg-[#166fe5] transition flex items-center justify-center gap-2.5 shadow-[0_4px_14px_rgba(24,119,242,0.35)] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Continue with Facebook (1-Click Setup)
            </button>

            <div className="text-center text-[11px] text-slate-500">
              Don&apos;t have a dedicated WhatsApp Business number yet? You can close this window and send immediately using{" "}
              <button
                type="button"
                onClick={onClose}
                className="text-slate-300 underline hover:text-white"
              >
                ShowUp&apos;s Verified Shared Sender
              </button>
              .
            </div>
          </div>

          {/* Collapsible Developer & App Review Diagnostics Drawer */}
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setShowDevTools((v) => !v)}
              className="w-full flex items-center justify-between text-[11px] font-mono text-slate-500 hover:text-slate-300 py-1 transition"
            >
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                Developer &amp; App Review Diagnostics
              </span>
              {showDevTools ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showDevTools && (
              <div className="mt-3 space-y-4 rounded-2xl bg-[#0d0f12] border border-white/[0.08] p-4">
                <div className="flex gap-2 border-b border-white/[0.08] pb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setDevTab("config")}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] ${
                      devTab === "config"
                        ? "bg-[#1877f2]/20 text-[#60a5fa] border border-[#1877f2]/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Meta Config &amp; Logs
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevTab("direct")}
                    className={`px-3 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1 ${
                      devTab === "direct"
                        ? "bg-[#1877f2]/20 text-[#60a5fa] border border-[#1877f2]/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <KeyRound className="w-3 h-3" />
                    Direct System Token / Sandbox
                  </button>
                </div>

                {devTab === "config" ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                          Configuration ID (Tech Provider)
                        </label>
                        <input
                          type="text"
                          value={configId}
                          onChange={(e) => setConfigId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171a22] border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-mono">
                          Meta App ID (Tech Provider)
                        </label>
                        <input
                          type="text"
                          value={appId}
                          onChange={(e) => setAppId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171a22] border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>
                        Origin:{" "}
                        <code className="text-[#60a5fa]">
                          {typeof window !== "undefined" ? window.location.origin : ""}
                        </code>
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleDirectTokenConnect(true)}
                          disabled={loading}
                          className="text-slate-400 hover:text-white underline font-mono"
                        >
                          Activate Sandbox Demo WABA
                        </button>
                        <a
                          href={directMetaHostedUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#60a5fa] hover:underline inline-flex items-center gap-1 font-mono"
                        >
                          Meta-Hosted URL
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Live Event Stream</span>
                        <button
                          type="button"
                          onClick={() => setLogs([])}
                          className="text-[10px] text-slate-500 hover:text-slate-300"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="h-24 overflow-y-auto font-mono text-[11px] text-slate-400 bg-black/60 p-2.5 rounded-lg border border-white/[0.07] space-y-1">
                        {logs.length === 0 ? (
                          <span className="text-slate-600">
                            Waiting for Embedded Signup events...
                          </span>
                        ) : (
                          logs.map((log, i) => (
                            <div key={i} className="leading-tight break-all">
                              {log}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          WABA ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 104928172635412"
                          value={manualWabaId}
                          onChange={(e) => setManualWabaId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171a22] border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Phone Number ID
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 109827364519283"
                          value={manualPhoneId}
                          onChange={(e) => setManualPhoneId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171a22] border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Display Phone Number
                        </label>
                        <input
                          type="text"
                          placeholder="+254 712 345 678"
                          value={manualDisplayPhone}
                          onChange={(e) => setManualDisplayPhone(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171a22] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          System User Access Token
                        </label>
                        <input
                          type="password"
                          placeholder="EAAG..."
                          value={manualToken}
                          onChange={(e) => setManualToken(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#171a22] border border-white/10 text-white text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => handleDirectTokenConnect(true)}
                        disabled={loading}
                        className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-xs text-slate-300"
                      >
                        Use Sandbox Demo
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDirectTokenConnect(false)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-xs text-white bg-[#1877f2] hover:bg-[#166fe5] transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Connect &amp; Provision 5 Templates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
