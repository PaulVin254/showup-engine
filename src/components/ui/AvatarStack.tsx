"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

export interface AvatarMember {
  name: string;
  niche: string;
  src?: string;
  initials: string;
  accentClass: string;
}

export interface AvatarStackProps {
  members?: AvatarMember[];
  overflowCount?: number;
  label?: string;
  sublabel?: string;
  className?: string;
}

const DEFAULT_MEMBERS: AvatarMember[] = [
  {
    name: "Wanjiru K.",
    niche: "Kilimani Real Estate",
    src: "/tokens/avatar-token.png",
    initials: "WK",
    accentClass: "from-amber-500/30 to-orange-600/30 text-amber-200",
  },
  {
    name: "Brian O.",
    niche: "Nairobi Forex Floor",
    src: "/tokens/kenya-creator-token.png",
    initials: "BO",
    accentClass: "from-[#1877f2]/40 to-blue-700/40 text-blue-200",
  },
  {
    name: "Achieng O.",
    niche: "E-Commerce Host",
    initials: "AO",
    accentClass: "from-[#00a884]/40 to-emerald-700/40 text-emerald-200",
  },
  {
    name: "Dr. Kevin M.",
    niche: "Westlands Consulting",
    src: "/tokens/simba-token.png",
    initials: "KM",
    accentClass: "from-purple-500/30 to-indigo-600/30 text-purple-200",
  },
];

/**
 * ShadcnSpace avatar-08 style overlapping Avatar Stack with hover tooltips,
 * verified WhatsApp status dots, and an overflow counter badge.
 */
export function AvatarStack({
  members = DEFAULT_MEMBERS,
  overflowCount = 214,
  label = "Trusted by Nairobi webinar hosts",
  sublabel = "Avg. 18% → 54% live show-up",
  className = "",
}: AvatarStackProps) {
  return (
    <div
      className={`inline-flex flex-wrap items-center justify-center gap-3.5 rounded-2xl border border-white/[0.08] bg-[#12141a]/90 px-4 py-2.5 shadow-lg ${className}`}
    >
      {/* Overlapping Avatar Group (avatar-08) */}
      <div className="flex items-center -space-x-2.5">
        {members.map((m, idx) => (
          <div
            key={m.name}
            className="group relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-2 ring-[#0d0f12] bg-[#171a22] transition-transform duration-200 hover:-translate-y-1 hover:z-20"
            style={{ zIndex: members.length - idx }}
          >
            <div
              className={`h-full w-full rounded-full overflow-hidden border border-white/15 bg-gradient-to-br ${m.accentClass} flex items-center justify-center text-[11px] font-semibold tracking-tight`}
            >
              {m.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.src}
                  alt={m.name}
                  className="h-full w-full object-cover scale-110"
                />
              ) : (
                <span>{m.initials}</span>
              )}
            </div>

            {/* Verified WhatsApp Emerald Status Dot */}
            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00a884] ring-2 ring-[#0d0f12]"
              aria-hidden="true"
            />

            {/* Hover Tooltip */}
            <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#171a22] px-2.5 py-1 text-[11px] text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
              <span className="font-semibold">{m.name}</span>
              <span className="text-slate-400"> · {m.niche}</span>
            </div>
          </div>
        ))}

        {/* Overflow Counter Badge (+N) */}
        <div
          className="relative z-0 inline-flex h-9 min-w-[2.4rem] px-2 items-center justify-center rounded-full ring-2 ring-[#0d0f12] border border-[#1877f2]/40 bg-[#1877f2]/20 font-mono text-[11px] font-bold text-[#60a5fa]"
          title={`${overflowCount}+ creators using ShowUp`}
        >
          +{overflowCount}
        </div>
      </div>

      {/* Social Proof Copy */}
      <div className="text-left leading-tight">
        <div className="flex items-center gap-1.5 text-xs font-medium text-white">
          <span>{label}</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-[#00a884] shrink-0" />
        </div>
        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
          {sublabel}
        </div>
      </div>
    </div>
  );
}
