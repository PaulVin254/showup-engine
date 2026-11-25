import React from "react";

/**
 * Kenyan-inspired rising attendance ribbon mark.
 */
export function BrandRibbon({ className = "w-16 h-16" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 92 80"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="showup-kenya-blue"
          x1="12"
          y1="66"
          x2="68"
          y2="12"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#111111" />
          <stop offset="55%" stopColor="#00a884" />
          <stop offset="100%" stopColor="#25d366" />
        </linearGradient>
        <linearGradient
          id="showup-savannah-gold"
          x1="46"
          y1="64"
          x2="82"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00a884" />
          <stop offset="100%" stopColor="#111111" />
        </linearGradient>
      </defs>

      <path
        d="M46 12C33 26 30 48 46 68C62 48 59 26 46 12Z"
        stroke="#e5e7eb"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 52C22 34 33 16 46 12C59 16 66 36 52 54C41 67 31 54 39 39C47 24 64 22 77 17"
        stroke="url(#showup-kenya-blue)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M46 42L60 28L77 17"
        stroke="url(#showup-savannah-gold)"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="77" cy="17" r="5" fill="#25d366" />
    </svg>
  );
}

/**
 * Minimal top-left brand lockup styled in the Mobbin light aesthetic.
 */
export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111111] text-white font-bold text-xs tracking-tight shrink-0">
        S
      </span>
      <span className="text-[16px] font-semibold tracking-[-0.02em] text-[#111111]">
        ShowUp
      </span>
      {subtitle && (
        <span className="hidden sm:inline-block text-xs text-neutral-500 font-normal pl-1">
          {subtitle}
        </span>
      )}
    </span>
  );
}

export function InlineAvatarToken({
  variant = "simba",
}: {
  variant?: "simba" | "creator";
}) {
  const src =
    variant === "creator"
      ? "/tokens/kenya-creator-token.png"
      : "/tokens/avatar-token.png";
  return (
    <span
      title="ShowUp Kenya Mascot"
      className="inline-flex items-center justify-center align-middle mx-1.5 -mt-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-[#f4f4f5] border border-neutral-200 shadow-xs select-none shrink-0 transition-transform duration-200 hover:scale-105"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="ShowUp Kenyan Mascot"
        className="w-full h-full object-cover scale-[1.22] shrink-0"
      />
    </span>
  );
}

export function InlineChartToken() {
  return (
    <span className="inline-flex items-center justify-center align-middle ml-1.5 -mt-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden select-none shrink-0 border border-neutral-200 shadow-xs transition-transform duration-200 hover:scale-105">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tokens/chart-token.png"
        alt=""
        className="w-full h-full object-cover scale-[1.28] shrink-0"
      />
    </span>
  );
}
