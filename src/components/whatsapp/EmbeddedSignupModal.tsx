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
  const [appId, setAppId] = useState(defaultAppId || "");
  const [configId, setConfigId] = useState(defaultConfigId || "1433645942194259");
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Direct / Developer token inputs
  const [manualWabaId, setManualWabaId] = useState(tenant.waba_id || "");
  const [manualPhoneId, setManualPhoneId] = useState(tenant.phone_number_id || "");
  const [manualDisplayPhone, setManualDisplayPhone] = useState(
    tenant.display_phone_number || "+254 712 345 678"
  );
  const [manualToken, setManualToken] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const handleMessage = (event: MessageEvent) => {
      if (
        !event.origin.includes("facebook.com") &&
        !event.origin.includes("meta.com")
      ) {
        return;
      }
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type === "WA_EMBEDDED_SIGNUP") {
          if (data.event === "FINISH" && data.data) {
            const { phone_number_id, waba_id } = data.data;
            if (waba_id) sessionStorage.setItem("showup_waba_id", waba_id);
            if (phone_number_id)
              sessionStorage.setItem("showup_phone_number_id", phone_number_id);
            setStatusMessage(
              `Captured WABA (${waba_id}) & Phone ID (${phone_number_id}) from Meta popup!`
            );
          }
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isOpen]);

  const initFbSdk = (targetAppId: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!targetAppId.trim()) {
        reject(new Error("Please enter your Meta App ID first."));
        return;
      }

      if (window.FB) {
        window.FB.init({
          appId: targetAppId.trim(),
          cookie: true,
          xfbml: true,
          version: "v21.0",
        });
        setSdkReady(true);
        resolve();
        return;
      }

      window.fbAsyncInit = function () {
        window.FB?.init({
          appId: targetAppId.trim(),
          cookie: true,
          xfbml: true,
          version: "v21.0",
        });
        setSdkReady(true);
        resolve();
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
      js.onerror = () =>
        reject(
          new Error(
            "Could not load Facebook SDK. Check if an adblocker is blocking connect.facebook.net."
          )
        );
      document.body.appendChild(js);
    });
  };

  const launchEmbeddedSignupPopup = async () => {
    setError(null);
    setStatusMessage(null);

    if (!appId.trim()) {
      setError(
        "Enter your 15-digit Meta App ID above so Facebook Login for Business can initialize."
      );
      return;
    }

    try {
      setLoading(true);
      await initFbSdk(appId);

      if (!window.FB) {
        throw new Error("Facebook JS SDK did not initialize.");
      }

      window.FB.login(
        function (response) {
          if (response?.authResponse?.code) {
            const code = response.authResponse.code;
            const wabaId =
              sessionStorage.getItem("showup_waba_id") || manualWabaId;
            const phoneNumberId =
              sessionStorage.getItem("showup_phone_number_id") || manualPhoneId;

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
              .then(async (res) => {
                const data = await res.json();
                if (!res.ok || data.error) {
                  throw new Error(data.error || "Failed onboarding WABA");
                }
                onConnected(data.tenant);
                onClose();
              })
              .catch((err: unknown) => {
                setError(
                  err instanceof Error ? err.message : "Failed completing callback"
                );
              })
              .finally(() => {
                setLoading(false);
              });
          } else {
            setLoading(false);
            setStatusMessage("Popup closed before authorization completed.");
          }
        },
        {
          config_id: configId.trim(),
          response_type: "code",
          override_default_response_type: true,
          extras: {
            setup: {},
            featureType: "",
            sessionInfoVersion: "3",
          },
        }
      );
    } catch (err: unknown) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Failed launching popup");
    }
  };

  const handleDirectTokenConnect = async (useSandboxDemo = false) => {
    setError(null);
    setLoading(true);

    try {
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

      if (!payload.wabaId || !payload.phoneNumberId || !payload.accessToken) {
        throw new Error(
          "Please provide WABA ID, Phone Number ID, and System User Access Token."
        );
      }

      const res = await fetch("/api/whatsapp/embedded-signup/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Connection failed");
      }

      onConnected(data.tenant);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
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
            1-Click Meta Embedded Signup Popup
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

        <div className="p-6 space-y-5">
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
                      Configuration ID (from your Meta Portal)
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
                      Meta App ID (top-left of Meta Portal)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 108294817263541"
                      value={appId}
                      onChange={(e) => setAppId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Note: Meta&apos;s JS SDK requires an <strong>HTTPS</strong> origin (or{" "}
                  <code className="text-slate-300">localhost</code> added to your Meta{" "}
                  <strong>Manage Domains allow list</strong>). When the client finishes the
                  popup, ShowUp Engine automatically registers their number and creates all 5
                  webinar templates.
                </p>
              </div>

              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <div className="text-xs font-medium text-slate-300">
                  What happens automatically after the client clicks &ldquo;Finish&rdquo;:
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Exchanges OAuth code for a non-expiring System User Access Token
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Calls <code className="text-slate-300">POST /&#123;waba_id&#125;/subscribed_apps</code> to attach webhooks
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Calls <code className="text-slate-300">POST /&#123;phone_number_id&#125;/register</code> to activate Cloud API
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    Provisions the 5 pre-approved Utility &amp; Marketing Webinar Templates
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDirectTokenConnect(true)}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
                >
                  Activate Sandbox Demo WABA (Instant Test)
                </button>

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
                  {sdkReady ? "Launch Meta Embedded Signup" : "Launch Meta Embedded Signup"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Use this tab to connect a client via a direct System User Token (for Concierge
                Pilots #1–5 or testing on <code className="text-slate-300">http://localhost</code>{" "}
                without an HTTPS tunnel).
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

