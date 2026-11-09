"use client";

import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";

/** Tiny looping M-Pesa STK prompt illustration. Mounts when its FAQ item opens. */
export function StkPushDemo() {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t = [setTimeout(() => setStep(1), 900), setTimeout(() => setStep(2), 2200)];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <div className="mt-4 max-w-xs rounded-2xl border border-white/10 bg-[#171a22] p-4 text-left">
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
        Illustration
      </div>
      {step < 2 ? (
        <div className={`mt-2 transition-opacity ${step === 0 ? "opacity-60" : "opacity-100"}`}>
          <div className="text-sm font-medium text-white">M-PESA</div>
          <div className="text-xs text-slate-300 mt-1">
            Pay KES 1,500 to ShowUp Engine. Enter your M-Pesa PIN.
          </div>
          <div className="mt-3 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${
                  step === 1 ? "bg-[#00a884]" : "bg-white/15"
                } transition-colors`}
                style={{ transitionDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-2 flex items-center gap-2 text-sm text-[#00a884]">
          <Check className="w-4 h-4" /> Payment confirmed. Launch pass active.
        </div>
      )}
    </div>
  );
}

