"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Mobile-only bottom CTA bar; appears once the hero CTA scrolls out of view. */
export function StickyMobileCta({
  href,
  targetId,
  label = "Start for free",
}: {
  href: string;
  targetId: string;
  label?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={!show}
      className={`sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur px-4 py-3 transition-transform duration-300 motion-reduce:transition-none ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] hover:bg-neutral-800 py-3 text-sm font-medium text-white transition"
      >
        {label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
