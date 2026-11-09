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
    <div ref={ref} className="neat-card neat-card-hover p-5 sm:p-6 flex flex-col gap-5 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-10 w-10 shrink-0 rounded-full overflow-hidden border border-white/15 bg-amber-100/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.avatarSrc ?? "/tokens/avatar-token.png"}
              alt=""
              className="h-full w-full object-cover"
            />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-white truncate">
              {r.name}
              {r.isVerifiedSender && (
                <BadgeCheck className="w-4 h-4 text-[#00a884] shrink-0" aria-label="Verified sender" />
              )}
            </div>
            <div className="text-[11px] text-slate-400 truncate">{r.role}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#1877f2]/10 border border-[#1877f2]/20 px-2 py-0.5 text-[11px] font-mono text-[#1877f2]">
          {lift}×
        </span>
      </div>

      <div
        role="img"
        aria-label={`Show-up rate rose from ${r.before}% to ${r.after}%`}
        className="space-y-2"
      >
        <div className="flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-slate-500 text-lg line-through decoration-slate-600">{r.before}%</span>
          <ArrowRight className="w-4 h-4 text-slate-500 self-center" />
          <span className="text-4xl font-bold text-white tracking-tight">{r.after}%</span>
          <span className="text-[11px] text-slate-400 ml-1">show-up</span>
        </div>
        <div className="relative h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-slate-500/60"
            style={{ width: `${r.before}%` }}
          />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#1877f2] to-[#00a884] motion-reduce:transition-none transition-[width] duration-1000 ease-out"
            style={{ width: seen ? `${r.after}%` : `${r.before}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>Email</span>
          <span>WhatsApp</span>
        </div>
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">“{r.quote}”</p>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] pt-4 text-[11px] font-mono text-slate-400">
        <span>{r.registrants} registrants</span>
        {r.revenueKes !== undefined && (
          <span className="text-[#00a884]">{kes.format(r.revenueKes)} M-Pesa sales</span>
        )}
        <span>{r.webinarWhen}</span>
        {r.isSample && <span className="ml-auto text-amber-400/80">Sample data</span>}
      </div>
    </div>
  );
}

export function CreatorResults({
  results,
  ctaHref = "/dashboard?setup=1",
  ctaLabel = "Create your webinar free",
  className = "",
}: CreatorResultsProps) {
  const [filter, setFilter] = useState<CreatorNiche | "all">("all");
  const niches = Array.from(new Set(results.map((r) => r.niche)));
  const shown = filter === "all" ? results : results.filter((r) => r.niche === filter);

  return (
    <div className={`max-w-5xl mx-auto ${className}`}>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {(["all", ...niches] as (CreatorNiche | "all")[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setFilter(n)}
            aria-pressed={filter === n}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              filter === n
                ? "bg-[#1877f2] border-[#1877f2] text-white"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
            }`}
          >
            {NICHE_LABEL[n]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {shown.map((r) => (
          <ResultCard key={r.id} r={r} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] px-6 py-3 text-sm font-semibold text-white transition shadow-[0_4px_14px_rgba(24,119,242,0.35)]"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

