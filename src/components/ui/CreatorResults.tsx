"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";

export type CreatorNiche = "real-estate" | "crypto-forex" | "ecommerce" | "consulting";

export interface CreatorResult {
  id: string;
  name: string;
  role: string;
  niche: CreatorNiche;
  avatarSrc?: string;
  isVerifiedSender: boolean;
  isSample: boolean;
  before: number;
  after: number;
  registrants: number;
  revenueKes?: number;
  webinarWhen: string;
  quote: string;
}

export interface CreatorResultsProps {
  results: CreatorResult[];
  ctaHref?: string;
  ctaLabel?: string;
  className?: string;
  /** Show niche filter tabs (default true). */
  showFilters?: boolean;
}

const NICHE_LABEL: Record<CreatorNiche | "all", string> = {
  all: "All",
  "real-estate": "Real Estate",
  "crypto-forex": "Crypto / Forex",
  ecommerce: "E-Commerce",
  consulting: "Consulting",
};

const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function ResultCard({ r }: { r: CreatorResult }) {
  const { ref, seen } = useInView<HTMLDivElement>();
  const lift = (r.after / r.before).toFixed(1).replace(".0", "");

  return (
    <div
      ref={ref}
      className="bg-white border border-neutral-200/90 hover:border-neutral-300 rounded-2xl p-6 flex flex-col gap-5 text-left shadow-[0_6px_24px_-12px_rgba(0,0,0,0.06)] transition"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-neutral-200 bg-[#f4f4f4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.avatarSrc ?? "/tokens/avatar-token.png"}
              alt={r.name}
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-[#111111] truncate">
              {r.name}
              {r.isVerifiedSender && (
                <BadgeCheck className="w-4 h-4 text-[#00a884] shrink-0" aria-label="Verified sender" />
              )}
            </div>
            <div className="text-[11px] text-neutral-500 truncate">{r.role}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#f4f4f4] border border-neutral-200 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-[#111111]">
          {lift}×
        </span>
      </div>

      <div
        role="img"
        aria-label={`Show-up rate rose from ${r.before}% to ${r.after}%`}
        className="flex flex-col gap-2"
      >
        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-neutral-400 text-lg line-through decoration-neutral-400">
            {r.before}%
          </span>
          <ArrowRight className="w-4 h-4 text-neutral-400 self-center" />
          <span className="text-4xl font-bold text-[#111111] tracking-tight">
            {r.after}%
          </span>
          <span className="text-[11px] text-neutral-500 ml-1">show-up</span>
        </div>
        <div className="relative h-2 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-neutral-300"
            style={{ width: `${r.before}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[#00a884] motion-reduce:transition-none transition-[width] duration-1000 ease-out"
            style={{ width: seen ? `${r.after}%` : `${r.before}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-neutral-400">
          <span>Email</span>
          <span>WhatsApp</span>
        </div>
      </div>

      <p className="text-sm text-neutral-600 leading-relaxed">“{r.quote}”</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-neutral-100 pt-4 text-[11px] font-mono text-neutral-500">
        <span>{r.registrants} registrants</span>
        {r.revenueKes !== undefined && (
          <span className="text-emerald-700 font-medium">
            {kes.format(r.revenueKes)} M-Pesa sales
          </span>
        )}
        <span>{r.webinarWhen}</span>
        {r.isSample && (
          <span className="ml-auto text-neutral-400">Sample data</span>
        )}
      </div>
    </div>
  );
}

export function CreatorResults({
  results,
  ctaHref = "/dashboard?setup=1",
  ctaLabel = "Create your webinar free",
  className = "",
  showFilters = true,
}: CreatorResultsProps) {
  const [filter, setFilter] = useState<CreatorNiche | "all">("all");
  const niches = Array.from(new Set(results.map((r) => r.niche)));
  const shown =
    filter === "all" ? results : results.filter((r) => r.niche === filter);

  return (
    <div className={`max-w-5xl mx-auto ${className}`}>
      <div
        className={`flex flex-wrap justify-center gap-2 mb-8 ${
          showFilters ? "" : "hidden"
        }`}
      >
        {(["all", ...niches] as (CreatorNiche | "all")[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setFilter(n)}
            aria-pressed={filter === n}
            className={`rounded-full border px-4 py-1.5 text-xs font-medium transition cursor-pointer ${
              filter === n
                ? "bg-[#111111] border-[#111111] text-white"
                : "border-neutral-200 bg-[#f4f4f4] text-neutral-600 hover:bg-neutral-200/70 hover:text-[#111111]"
            }`}
          >
            {NICHE_LABEL[n]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {shown.map((r) => (
          <ResultCard key={r.id} r={r} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-full bg-[#111111] hover:bg-neutral-800 px-6 py-3 text-sm font-medium text-white transition"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
