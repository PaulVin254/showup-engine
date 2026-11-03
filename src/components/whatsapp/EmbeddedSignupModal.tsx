"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
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
  const [activeTab, setActiveTab] = useState<"embedded" | "direct">("embedded");
  const [appId, setAppId] = useState(defaultAppId || "946759377779936");
  const [configId, setConfigId] = useState(defaultConfigId || "1433645942194259");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

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

            const captured = `Captured WABA ID: ${waba_id} | Phone ID: ${phone_number_id}`;
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
        const err = "Please enter your Meta App ID first.";
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
            version: "v26.0",
          });
          addLog("FB SDK initialized successfully (v26.0)");
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
            version: "v26.0",
          });
          addLog("FB SDK init complete via fbAsyncInit (v26.0)");
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
      const msg = "Enter your Meta App ID above so Facebook Login can initialize.";
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

        // Standard function callback to satisfy Meta's legacy validator
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
                "Exchanging authorization code & provisioning 5 Webinar Templates..."
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
              const cancelMsg = "Popup closed before authorization completed.";
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Connect Official WhatsApp Business API
              </h3>
              <p className="text-xs text-slate-400">
                Meta Tech Provider Embedded Signup • Zero Ban Risk • Auto-Template Provisioning
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

        {/* Mode Switcher */}
        <div className="px-6 pt-4 flex gap-2 border-b border-slate-800">
          <button
            onClick={() => setActiveTab("embedded")}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "embedded"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            1-Click Meta Embedded Signup
          </button>
          <button
            onClick={() => setActiveTab("direct")}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === "direct"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Direct System Token / Localhost Test
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {activeTab === "embedded" ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Your Live Meta Embedded Signup Config
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    Tech Provider Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Configuration ID
                    </label>
                    <input
                      type="text"
                      value={configId}
                      onChange={(e) => setConfigId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">
                      Meta App ID
                    </label>
                    <input
                      type="text"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Origin: <code className="text-emerald-300">{typeof window !== "undefined" ? window.location.origin : ""}</code></span>
                  <a
                    href={directMetaHostedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Open Meta-Hosted Onboarding URL
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* In-App Live Debug Console */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    Live Debug Event Stream (Check F12 Console for full logs)
                  </span>
                  <button
                    type="button"
                    onClick={() => setLogs([])}
                    className="text-[10px] text-slate-500 hover:text-slate-300"
                  >
                    Clear Logs
                  </button>
                </div>
                <div className="h-28 overflow-y-auto font-mono text-[11px] text-slate-300 bg-black/60 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                  {logs.length === 0 ? (
                    <span className="text-slate-600">Waiting for actions... click &quot;Launch Meta Embedded Signup&quot; to begin.</span>
                  ) : (
                    logs.map((log, i) => (
                      <div key={i} className="leading-tight break-all">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleDirectTokenConnect(true)}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
                >
                  Activate Sandbox Demo WABA
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={directMetaHostedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Meta Hosted Page
                  </a>

                  <button
                    type="button"
                    onClick={launchEmbeddedSignupPopup}
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Launch Meta Embedded Signup
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Use this tab to connect via a direct System User Token (for Concierge Pilots #1–5).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104928172635412"
                    value={manualWabaId}
                    onChange={(e) => setManualWabaId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 109827364519283"
                    value={manualPhoneId}
                    onChange={(e) => setManualPhoneId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Display Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+254 712 345 678"
                    value={manualDisplayPhone}
                    onChange={(e) => setManualDisplayPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    System User Permanent Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="EAAG..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => handleDirectTokenConnect(true)}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300"
                >
                  Use Sandbox Demo Credentials
                </button>

                <button
                  type="button"
                  onClick={() => handleDirectTokenConnect(false)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Connect &amp; Provision 5 Templates
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
