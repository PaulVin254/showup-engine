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
    accentClass: "bg-amber-100 text-amber-800",
  },
  {
    name: "Brian O.",
    niche: "Nairobi Forex Floor",
    src: "/tokens/kenya-creator-token.png",
    initials: "BO",
    accentClass: "bg-blue-100 text-blue-800",
  },
  {
    name: "Achieng O.",
    niche: "E-Commerce Host",
    initials: "AO",
    accentClass: "bg-emerald-100 text-emerald-800",
  },
  {
    name: "Dr. Kevin M.",
    niche: "Westlands Consulting",
    src: "/tokens/simba-mascot-token.png",
    initials: "KM",
    accentClass: "bg-neutral-200 text-neutral-800",
  },
];

export function AvatarStack({
  members = DEFAULT_MEMBERS,
  overflowCount = 214,
  label = "Trusted by Nairobi webinar hosts",
  sublabel = "Avg. 18% to 54% live show-up",
  className = "",
}: AvatarStackProps) {
  return (
    <div
      className={`inline-flex flex-wrap items-center justify-center gap-3.5 rounded-full border border-neutral-200 bg-[#f4f4f4] px-4 py-2 ${className}`}
    >
      <div className="flex items-center -space-x-2.5">
        {members.map((m, idx) => (
          <div
            key={m.name}
            className="group relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-2 ring-white bg-white transition-transform duration-200 hover:-translate-y-0.5 hover:z-20"
            style={{ zIndex: members.length - idx }}
          >
            <div
              className={`h-full w-full rounded-full overflow-hidden border border-neutral-200 ${m.accentClass} flex items-center justify-center text-[11px] font-semibold tracking-tight`}
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

            <span
              className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#00a884] ring-2 ring-white"
              aria-hidden="true"
            />

            <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] text-[#111111] opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
              <span className="font-semibold">{m.name}</span>
              <span className="text-neutral-500"> · {m.niche}</span>
            </div>
          </div>
        ))}

        <div
          className="relative z-0 inline-flex h-8 min-w-[2.25rem] px-2 items-center justify-center rounded-full ring-2 ring-white bg-[#111111] font-mono text-[10px] font-bold text-white"
          title={`${overflowCount}+ creators using ShowUp`}
        >
          +{overflowCount}
        </div>
      </div>

      <div className="text-left leading-tight pr-1">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[#111111]">
          <span>{label}</span>
          <CheckCircle2 className="h-3.5 w-3.5 text-[#00a884] shrink-0" />
        </div>
        <div className="text-[11px] font-mono text-neutral-500 mt-0.5">
          {sublabel}
        </div>
      </div>
    </div>
  );
}
