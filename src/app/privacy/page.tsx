import React from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandMark";

export const metadata = {
  title: "Privacy Policy | ShowUp Engine (showup.eris.co.ke)",
  description:
    "Privacy Policy and Meta WhatsApp Cloud API data handling practices for ShowUp Engine.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-200 antialiased">
      <header className="w-full px-6 sm:px-10 py-4.5 flex items-center justify-between border-b border-white/[0.08]">
        <Link href="/">
          <BrandWordmark subtitle="Privacy Policy" />
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
            Privacy Policy
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Effective Date: November 2026 · Domain: https://showup.eris.co.ke
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            1. Overview &amp; Scope
          </h2>
          <p>
            ShowUp Engine (&ldquo;ShowUp&rdquo;, operated at{" "}
            <code className="text-slate-200">https://showup.eris.co.ke</code>)
            provides automated webinar registration and East Africa Time (EAT)
            WhatsApp reminder sequences via the official Meta WhatsApp Cloud
            API. This Privacy Policy explains how we collect, process, store,
            and protect personal and business data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            2. Data We Collect
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Webinar Hosts (Creators):</strong> Business name, phone
              number, email address, M-Pesa transaction receipts, and—when you
              connect your own WhatsApp Business Account via Meta Embedded
              Signup—your WhatsApp Business Account ID (<code className="text-slate-200">waba_id</code>),
              Phone Number ID (<code className="text-slate-200">phone_number_id</code>), and scoped OAuth
              access token.
            </li>
            <li>
              <strong>Webinar Registrants (Attendees):</strong> First/full name,
              phone number (normalized to E.164 format), optional email address,
              registration timestamp, and message delivery/opt-out status.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            3. How We Use Meta Platform Data
          </h2>
          <p>
            When a host authorizes ShowUp via{" "}
            <strong>Meta Embedded Signup</strong> (requesting{" "}
            <code className="text-slate-200">whatsapp_business_management</code> and{" "}
            <code className="text-slate-200">whatsapp_business_messaging</code> permissions), we use
            those credentials strictly to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Provision pre-approved webinar reminder message templates in the
              host&apos;s WhatsApp Business Account.
            </li>
            <li>
              Dispatch scheduled webinar confirmation and countdown reminders to
              opted-in registrants.
            </li>
            <li>
              Process delivery receipts and immediate <code className="text-slate-200">STOP</code>{" "}
              opt-out replies via Meta webhooks.
            </li>
          </ul>
          <p>
            We never sell, rent, or share Meta Platform Data or registrant phone
            numbers with third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            4. Opt-Out &amp; Data Deletion Requests
          </h2>
          <p>
            Attendees may opt out of WhatsApp reminders at any time by replying{" "}
            <strong>STOP</strong> to any message, which immediately halts all
            future scheduled messages. Hosts or registrants may request full
            deletion of their account or personal data by emailing{" "}
            <a
              href="mailto:founder@eris.co.ke"
              className="text-[#60a5fa] underline"
            >
              founder@eris.co.ke
            </a>
            . All verified deletion requests are completed within 7 business
            days in compliance with the Kenya Data Protection Act, 2019 and Meta
            Platform Terms.
          </p>
        </section>
      </main>
    </div>
  );
}

