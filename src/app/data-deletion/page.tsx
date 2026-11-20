import React from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/BrandMark";

export const metadata = {
  title: "User Data Deletion | ShowUp Engine (showup.eris.co.ke)",
  description:
    "How webinar hosts and registrants can request deletion of personal and Meta WhatsApp Business Platform data from ShowUp Engine.",
};

export default function UserDataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-200 antialiased">
      <header className="w-full px-6 sm:px-10 py-4.5 flex items-center justify-between border-b border-white/[0.08]">
        <Link href="/">
          <BrandWordmark subtitle="Data Deletion" />
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
            User Data Deletion
          </h1>
          <p className="text-xs font-mono text-slate-500 mt-1">
            Effective Date: November 2026 · Domain: https://showup.eris.co.ke · Compliance: Meta Platform Terms &amp; Kenya Data Protection Act, 2019
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            1. Scope of Data Deleted
          </h2>
          <p>
            ShowUp Engine (<code className="text-slate-200">https://showup.eris.co.ke</code>)
            allows both webinar hosts and event registrants to permanently remove
            their personal and Meta WhatsApp Business Platform data from our
            systems:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Webinar Hosts (Creators):</strong> Account profile,
              business name, phone number, email address, connected WhatsApp
              Business Account ID (<code className="text-slate-200">waba_id</code>), Phone Number ID (<code className="text-slate-200">phone_number_id</code>), scoped OAuth access tokens, created events, custom
              templates, and scheduled reminder queues.
            </li>
            <li>
              <strong>Webinar Registrants (Attendees):</strong> Full name,
              normalized E.164 WhatsApp phone number, optional email address,
              tracked join/click logs, and message delivery status records.
            </li>
          </ul>
          <p className="text-xs text-slate-400">
            Note: Anonymized M-Pesa transaction accounting records may be
            retained solely where required by Kenyan tax and statutory
            record-keeping law.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            2. Option A — Revoke Meta / Facebook Access (For Hosts)
          </h2>
          <p>
            If you connected your WhatsApp Business Account to ShowUp Engine via{" "}
            <strong>Meta Embedded Signup</strong>, you can immediately revoke our
            app&apos;s access to <code className="text-slate-200">whatsapp_business_management</code> and{" "}
            <code className="text-slate-200">whatsapp_business_messaging</code> permissions from your
            Facebook account:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>
              Go to your Facebook account&apos;s{" "}
              <strong>Settings &amp; Privacy → Settings</strong>.
            </li>
            <li>
              Open <strong>Business Integrations</strong> (or{" "}
              <strong>Apps and Websites</strong> in personal settings).
            </li>
            <li>
              Locate <strong>ShowUp Engine</strong> in the active list and click{" "}
              <strong>Remove</strong> to revoke all granted permissions and
              invalidate active tokens.
            </li>
          </ol>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            3. Option B — Full Account &amp; Data Erasure via Email
          </h2>
          <p>
            To request permanent erasure of your ShowUp Engine account, hosted
            events, Meta tokens, or registrant records from our database, email{" "}
            <a
              href="mailto:founder@eris.co.ke?subject=Data%20Deletion%20Request%20-%20ShowUp%20Engine"
              className="text-[#60a5fa] underline"
            >
              founder@eris.co.ke
            </a>{" "}
            with the subject{" "}
            <code className="text-slate-200">Data Deletion Request - ShowUp Engine</code> and include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              Your registered WhatsApp phone number (e.g., <code className="text-slate-200">+254...</code>).
            </li>
            <li>
              For hosts with a connected WhatsApp Business Account: your business
              name or WABA ID (<code className="text-slate-200">waba_id</code>) if available.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            4. Option C — Immediate Attendee WhatsApp Opt-Out
          </h2>
          <p>
            Webinar attendees can immediately stop all scheduled WhatsApp
            reminders at any time by replying <strong>STOP</strong> to any
            ShowUp Engine message. To permanently erase your name, phone number,
            and click logs after opting out, send a deletion request to{" "}
            <a
              href="mailto:founder@eris.co.ke?subject=Data%20Deletion%20Request%20-%20ShowUp%20Engine"
              className="text-[#60a5fa] underline"
            >
              founder@eris.co.ke
            </a>
            .
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-white">
            5. Verification &amp; Deletion Timeline
          </h2>
          <p>
            To protect accounts from unauthorized deletion, we verify ownership
            via your registered WhatsApp number or email address before purging
            records. All verified deletion requests are permanently fulfilled
            within <strong>7 business days</strong> in compliance with the Kenya
            Data Protection Act, 2019 and Meta Platform Terms, and we send a
            confirmation once erasure is complete.
          </p>
        </section>

        <div className="pt-6 border-t border-white/[0.08] flex items-center gap-4 text-xs text-slate-400">
          <Link href="/privacy" className="hover:text-white transition underline">
            Privacy Policy
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-white transition underline">
            Terms of Service
          </Link>
        </div>
      </main>
    </div>
  );
}
