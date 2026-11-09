"use client";

import React, { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { soundFx } from "@/lib/interactive-delight";

export type FaqCategory = "safety" | "payments" | "leads" | "streaming";

export interface FaqItem {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
  demo?: React.ReactNode;
  bullets?: string[];
}

export interface ObjectionFaqProps {
  items: FaqItem[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  onOpen?: (id: string) => void;
  className?: string;
}

export function ObjectionFaq({
  items,
  defaultOpenId,
  allowMultiple = false,
  onOpen,
  className = "",
}: ObjectionFaqProps) {
  const [open, setOpen] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);

  const toggle = (id: string) => {
    const isOpen = open.includes(id);
    if (!isOpen) {
      soundFx.playClick();
      onOpen?.(id);
    }
    setOpen((prev) =>
      isOpen ? prev.filter((x) => x !== id) : allowMultiple ? [...prev, id] : [id]
    );
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };

  return (
    <div className={`max-w-3xl mx-auto space-y-3 ${className}`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            className={`neat-card neat-card-hover overflow-hidden ${
              isOpen ? "!border-[#1877f2]/40" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-${item.id}`}
              className="w-full flex items-center gap-3 p-4 sm:p-5 text-left"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  isOpen
                    ? "bg-[#1877f2]/15 border-[#1877f2]/40 text-[#1877f2]"
                    : "bg-white/5 border-white/10 text-slate-300"
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium text-white">
                {item.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <div
              id={`faq-${item.id}`}
              role="region"
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="px-4 sm:px-5 pb-5 pl-[3.75rem] sm:pl-[4.25rem] text-sm text-slate-400 leading-relaxed">
                  <p>{item.answer}</p>
                  {item.bullets && (
                    <ul className="mt-3 space-y-1.5">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-slate-300 text-xs">
                          <Check className="w-3.5 h-3.5 text-[#00a884] shrink-0" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                  {isOpen && item.demo}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

