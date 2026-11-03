import React from "react";

/**
 * Free-floating calligraphic electric-blue ribbon mark in the exact spirit of Meta Muse.
 * Never wrapped in a bordered square container.
 */
export function BrandRibbon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 88 76"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="muse-ribbon-a" x1="8" y1="62" x2="48" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0056d6" />
          <stop offset="55%" stopColor="#1877f2" />
          <stop offset="100%" stopColor="#4593ff" />
        </linearGradient>
        <linearGradient id="muse-ribbon-b" x1="34" y1="64" x2="80" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0051c4" />
          <stop offset="50%" stopColor="#1877f2" />
          <stop offset="100%" stopColor="#5aa2ff" />
        </linearGradient>
      </defs>
      {/* Back fold shadow for ribbon depth */}
      <path
        d="M27 14C31 14 33 27 32 56"
        stroke="#003c96"
        strokeWidth="10.5"
        strokeLinecap="round"
      />
      <path
        d="M54 22C57 22 58 35 56 56"
        stroke="#003c96"
        strokeWidth="10.5"
        strokeLinecap="round"
      />
      {/* Primary calligraphic ribbon strokes */}
      <path
        d="M11 45C17 24 24 13 28 14C33 15 29 56 33 57C37 58 47 21 54 22"
        stroke="url(#muse-ribbon-a)"
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 57C38 57 48 21 54 22C59 23 53 55 58 56C63 57 71 42 77 31"
        stroke="url(#muse-ribbon-b)"
        strokeWidth="10.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Minimal top-left brand lockup (like "∞ Meta" in the Muse screenshot).
 */
export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 36 24"
        fill="none"
        className="w-6 h-4 text-white shrink-0"
        aria-hidden="true"
      >
        <path
          d="M3 16.5C5.5 8 9 4.5 11 5C13.2 5.5 11.5 18.5 13.8 19C16 19.5 20.5 7 23.2 7.5C25.5 8 23.5 18 26 18.5C28.2 19 31.2 13.5 33 9.5"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-white">
        ShowUp
      </span>
      {subtitle && (
        <span className="hidden sm:inline-block text-xs text-[#7c828e] font-normal pl-1">
          {subtitle}
        </span>
      )}
    </span>
  );
}

/**
 * Inline 3D tactile avatar token that sits inside the H1 line after "ShowUp"
 */
export function InlineAvatarToken() {
  return (
    <span className="inline-flex items-center justify-center align-middle mx-1.5 -mt-1.5 w-11 h-11 sm:w-14 sm:h-14 md:w-[60px] md:h-[60px] rounded-full overflow-hidden bg-[#e8dfd5] shadow-[0_4px_14px_rgba(0,0,0,0.45)] select-none shrink-0 transition-transform duration-200 hover:scale-105">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tokens/avatar-token.png"
        alt=""
        className="w-full h-full object-cover scale-[1.24]"
      />
    </span>
  );
}

/**
 * Inline 3D tactile pie-chart token that sits at the end of the H1 second line
 */
export function InlineChartToken() {
  return (
    <span className="inline-flex items-center justify-center align-middle ml-2 -mt-1.5 w-12 h-12 sm:w-14 sm:h-14 md:w-[64px] md:h-[64px] rounded-full overflow-hidden select-none shrink-0 transition-transform duration-200 hover:scale-105">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tokens/chart-token.png"
        alt=""
        className="w-full h-full object-cover scale-[1.32]"
      />
    </span>
  );
}
