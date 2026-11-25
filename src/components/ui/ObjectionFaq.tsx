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
    <div className={`max-w-3xl mx-auto flex flex-col gap-3 ${className}`}>
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
            className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
              isOpen ? "border-[#111111]" : "border-neutral-200/90 hover:border-neutral-300"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              aria-expanded={isOpen}
              aria-controls={`faq-${item.id}`}
              className="w-full flex items-center gap-3 p-4 sm:p-5 text-left cursor-pointer"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                  isOpen
                    ? "bg-[#111111] border-[#111111] text-white"
                    : "bg-[#f4f4f4] border-neutral-200 text-neutral-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </span>
              <span className="flex-1 text-sm sm:text-base font-medium text-[#111111]">
                {item.question}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${
                  isOpen ? "rotate-180 text-[#111111]" : ""
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
                <div className="px-4 sm:px-5 pb-5 pl-[3.75rem] sm:pl-[4.25rem] text-sm text-neutral-600 leading-relaxed">
                  <p>{item.answer}</p>
                  {item.bullets && (
                    <ul className="mt-3 flex flex-col gap-1.5">
                      {item.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2 text-neutral-700 text-xs">
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
