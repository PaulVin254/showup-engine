"use client";

import React from "react";

/**
 * Hand-drawn sketchbook character doodle inspired by @kedhareswer/doodle-crew-footer.
 * Pure SVG with dry-brush ink strokes, peeking paws, floating stars, and a curved scribble arrow.
 */
export function DoodleCharacter({
  caption = "Pay only when you go live!",
  className = "",
}: {
  caption?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-3 select-none group ${className}`}
      aria-hidden="true"
    >
      {/* Hand-drawn speech note + curved ink arrow */}
      <div className="flex flex-col items-end">
        <span className="rounded-full border border-dashed border-[#1877f2]/40 bg-[#1877f2]/[0.07] px-3 py-1 font-mono text-[11px] text-[#60a5fa] -rotate-2 transition-transform duration-300 group-hover:rotate-0">
          ✎ {caption}
        </span>
        <svg
          viewBox="0 0 90 36"
          fill="none"
          className="w-16 h-7 text-[#1877f2] -mt-0.5 mr-2"
        >
          <path
            d="M8 26C26 30 52 24 72 8"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeDasharray="4 3"
          />
          <path
            d="M63 6L74 7L71 18"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Peeking Sketchbook Character (Pure SVG dry-brush ink doodle) */}
      <svg
        viewBox="0 0 120 100"
        fill="none"
        className="w-24 h-20 shrink-0 transition-transform duration-300 group-hover:-translate-y-1"
      >
        {/* Floating ink sparkles / stars */}
        <path
          d="M18 22L20 16L22 22L28 24L22 26L20 32L18 26L12 24L18 22Z"
          stroke="#fbbf24"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M102 18L103.5 14L105 18L109 19.5L105 21L103.5 25L102 21L98 19.5L102 18Z"
          stroke="#00a884"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="96" cy="36" r="2" fill="#1877f2" />
        <circle cx="24" cy="44" r="1.8" fill="#00a884" />

        {/* Ears / Tuft */}
        <path
          d="M36 44C30 30 35 20 45 28"
          stroke="#e2e8f0"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M84 44C90 30 85 20 75 28"
          stroke="#e2e8f0"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Crown / Hair scribble */}
        <path
          d="M52 24L57 16L61 23L66 15L69 25"
          stroke="#fbbf24"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Character Head Dome peeking over the ledge */}
        <path
          d="M32 78C30 50 41 26 60 26C79 26 90 50 88 78"
          fill="#171a22"
          stroke="#e2e8f0"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Expressive Doodle Eyes */}
        <circle cx="49" cy="52" r="5.5" fill="#e2e8f0" />
        <circle cx="71" cy="52" r="5.5" fill="#e2e8f0" />
        <circle cx="50.5" cy="52" r="2.5" fill="#0d0f12" />
        <circle cx="72.5" cy="52" r="2.5" fill="#0d0f12" />
        <circle cx="52" cy="50.5" r="1" fill="#ffffff" />
        <circle cx="74" cy="50.5" r="1" fill="#ffffff" />

        {/* Happy Doodle Grin & Rosy Cheeks */}
        <path
          d="M54 63C57 67 63 67 66 63"
          stroke="#00a884"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path d="M40 59L44 58" stroke="#1877f2" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M76 58L80 59" stroke="#1877f2" strokeWidth="2.2" strokeLinecap="round" />

        {/* Sketchbook Ledge & Peeking Paws */}
        <path
          d="M14 78H106"
          stroke="#334155"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="8 4"
        />
        <path
          d="M36 74C36 82 46 82 46 74"
          fill="#171a22"
          stroke="#e2e8f0"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <path
          d="M74 74C74 82 84 82 84 74"
          fill="#171a22"
          stroke="#e2e8f0"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export const DoodleArrow = DoodleCharacter;
