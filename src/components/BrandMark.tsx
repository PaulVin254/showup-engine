import React from "react";

/**
 * Kenyan-inspired free-floating 3D tactile mark in the Muse aesthetic:
 * Combines a fluid electric-blue rising attendance ribbon with a subtle
 * Maasai shield / Savannah sun crest accent — never boxed in a square container.
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
          <stop offset="0%" stopColor="#0051c4" />
          <stop offset="50%" stopColor="#1877f2" />
          <stop offset="100%" stopColor="#5aa2ff" />
        </linearGradient>
        <linearGradient
          id="showup-savannah-gold"
          x1="46"
          y1="64"
          x2="82"
          y2="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#1877f2" />
          <stop offset="65%" stopColor="#4589ff" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Deep 3D shadow under-fold */}
      <path
        d="M46 12C33 26 30 48 46 68C62 48 59 26 46 12Z"
        stroke="#0a2558"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.65"
      />

      {/* Iconic Kenyan Shield Contour & Rising Attendance Wave */}
      <path
        d="M16 52C22 34 33 16 46 12C59 16 66 36 52 54C41 67 31 54 39 39C47 24 64 22 77 17"
        stroke="url(#showup-kenya-blue)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Warm Savannah sun / Maasai beadwork spark at the crest */}
      <path
        d="M46 42L60 28L77 17"
        stroke="url(#showup-savannah-gold)"
        strokeWidth="8.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="77" cy="17" r="5" fill="#fbbf24" />
    </svg>
  );
}

/**
 * Minimal top-left brand lockup in the Muse spirit, featuring the Kenyan shield-wave icon.
 */
export function BrandWordmark({ subtitle }: { subtitle?: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <svg
        viewBox="0 0 36 28"
        fill="none"
        className="w-6 h-5 text-white shrink-0"
        aria-hidden="true"
      >
        <path
          d="M4 20C7 12 12 5 18 3.5C24 5 26 13 20.5 20.5C16 26 11.5 20.5 15 14C18.5 7.5 26 7 32 4.5"
          stroke="#4589ff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="32" cy="4.5" r="2.3" fill="#fbbf24" />
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
 * Inline 3D tactile Kenyan Simba / Creator mascot token that sits inside the H1 line after "ShowUp"
 */
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
      className="inline-flex items-center justify-center align-middle mx-1.5 -mt-1 w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-full overflow-hidden bg-[#e8dfd5] border-2 border-white/20 shadow-md select-none shrink-0 transition-transform duration-200 hover:scale-105"
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

/**
 * Inline 3D tactile pie-chart token that sits at the end of the H1 second line
 */
export function InlineChartToken() {
  return (
    <span className="inline-flex items-center justify-center align-middle ml-1.5 -mt-1 w-8 h-8 sm:w-11 sm:h-11 md:w-13 md:h-13 rounded-full overflow-hidden select-none shrink-0 border-2 border-white/20 shadow-md transition-transform duration-200 hover:scale-105">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/tokens/chart-token.png"
        alt=""
        className="w-full h-full object-cover scale-[1.28] shrink-0"
      />
    </span>
  );
}
