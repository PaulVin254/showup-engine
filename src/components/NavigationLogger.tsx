"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function LoggerContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fullUrl = `${pathname}${
      searchParams?.toString() ? `?${searchParams.toString()}` : ""
    }`;
    const timestamp = new Date().toISOString();

    console.groupCollapsed(
      `%c[ShowUp Navigation]%c ${fullUrl} %c@ ${timestamp}`,
      "background: #10b981; color: #022c22; font-weight: bold; border-radius: 4px; padding: 2px 6px;",
      "color: #38bdf8; font-weight: bold;",
      "color: #94a3b8; font-size: 10px;"
    );
    console.log("📍 Pathname:", pathname);
    console.log("🔍 Search Params:", searchParams?.toString() || "(none)");
    console.log("🌐 Origin:", window.location.origin);
    console.log("🖥️ Referrer:", document.referrer || "(direct / none)");
    console.log(
      "📱 Facebook SDK Status:",
      (window as unknown as { FB?: unknown }).FB ? "AVAILABLE (window.FB exists)" : "NOT LOADED YET"
    );
    console.log("💾 SessionStorage Keys:", {
      showup_waba_id: sessionStorage.getItem("showup_waba_id"),
      showup_phone_number_id: sessionStorage.getItem("showup_phone_number_id"),
    });
    console.groupEnd();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleGlobalMessage = (event: MessageEvent) => {
      // Log any postMessage originating from facebook.com or current origin
      if (
        event.origin.includes("facebook.com") ||
        event.origin.includes("meta.com") ||
        event.origin === window.location.origin
      ) {
        console.group(
          `%c[ShowUp PostMessage Event]%c From: ${event.origin}`,
          "background: #3b82f6; color: #eff6ff; font-weight: bold; border-radius: 4px; padding: 2px 6px;",
          "color: #a5f3fc; font-weight: bold;"
        );
        console.log("📦 Raw Data:", event.data);
        try {
          const parsed = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
          console.log("🔍 Parsed JSON:", parsed);
        } catch {
          // not JSON, already logged as raw
        }
        console.groupEnd();
      }
    };

    const handleGlobalError = (event: ErrorEvent) => {
      console.group(
        `%c[ShowUp Runtime Error]%c ${event.message}`,
        "background: #ef4444; color: #fff; font-weight: bold; border-radius: 4px; padding: 2px 6px;",
        "color: #fca5a5;"
      );
      console.log("📄 Source:", `${event.filename}:${event.lineno}:${event.colno}`);
      console.log("💥 Error Object:", event.error);
      console.groupEnd();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.group(
        `%c[ShowUp Promise Rejection]%c ${event.reason}`,
        "background: #f97316; color: #fff; font-weight: bold; border-radius: 4px; padding: 2px 6px;",
        "color: #fdba74;"
      );
      console.log("💥 Rejection Reason:", event.reason);
      console.groupEnd();
    };

    window.addEventListener("message", handleGlobalMessage);
    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    console.log(
      "%c[ShowUp Engine]%c Global Console Diagnostics Active 🚀 Open DevTools (F12) to monitor live navigation, Meta SDK messages, and background API traffic.",
      "background: #25D366; color: #022c22; font-weight: bold; border-radius: 4px; padding: 3px 8px;",
      "color: #22d3ee; font-weight: normal; margin-left: 6px;"
    );

    return () => {
      window.removeEventListener("message", handleGlobalMessage);
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

export function NavigationLogger() {
  return (
    <Suspense fallback={null}>
      <LoggerContent />
    </Suspense>
  );
}
