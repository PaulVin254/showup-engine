"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Mobile-only bottom CTA bar; appears once the hero CTA scrolls out of view. */
export function StickyMobileCta({
  href,
  targetId,
  label = "Create your webinar free",
}: {
  href: string;
  /** id of the hero CTA element to observe */
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
      className={`sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#0d0f12]/90 backdrop-blur px-4 py-3 transition-transform duration-300 motion-reduce:transition-none ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <Link
        href={href}
        tabIndex={show ? 0 : -1}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1877f2] hover:bg-[#166fe5] py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(24,119,242,0.35)] transition"
      >
        {label}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

