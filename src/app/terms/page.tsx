import React from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandMark";

export const metadata = {
  title: "Terms of Service | ShowUp Engine (showup.eris.co.ke)",
  description:
    "Terms of Service for ShowUp Engine webinar reminder automation.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-200 antialiased">
      <header className="w-full px-6 sm:px-10 py-4.5 flex items-center justify-between border-b border-white/[0.08]">
        <Link href="/">
          <BrandWordmark subtitle="Terms of Service" />
        </Link>
        <Link
          href="/"
          className="text-xs text-slate-400 hover:text-white transition"
        >
          ← Back to Home
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-14 space-y-8 text-sm leading-relaxed text-slate-300">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Effective Date: November 2026 · Domain: https://showup.eris.co.ke
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            1. Service Description
          </h2>
          <p>
            ShowUp Engine (<code className="text-slate-200">https://showup.eris.co.ke</code>) enables
            webinar hosts, educators, and businesses in Kenya and East Africa to
            send automated 5-stage WhatsApp event reminders via the official
            Meta WhatsApp Cloud API.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            2. Acceptable Use &amp; Registrant Consent
          </h2>
          <p>
            Hosts warrant that every registrant imported or connected into
            ShowUp Engine has explicitly opted in to receive event reminders for
            the specified webinar or masterclass. Sending unsolicited bulk spam
            or prohibited content is strictly forbidden and will result in
            immediate account termination.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            3. Per-Webinar M-Pesa Billing &amp; Guarantee
          </h2>
          <p>
            ShowUp charges per launched webinar pass via M-Pesa STK Push (KES
            1,500 for up to 200 registrants or KES 3,000 for up to 500
            registrants). There are no recurring monthly lock-in fees.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">4. Contact</h2>
          <p>
            For support, billing, or compliance inquiries, contact{" "}
            <a
              href="mailto:founder@eris.co.ke"
              className="text-[#60a5fa] underline"
            >
              founder@eris.co.ke
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}

