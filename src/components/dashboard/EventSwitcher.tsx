"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Calendar,
  Users,
} from "lucide-react";
import { ShowUpEvent, ShowUpRegistrant } from "@/lib/types";
import { deriveLifecycle, fmtEat } from "@/lib/lifecycle";
import { cn } from "@/lib/cn";

export interface EventSwitcherProps {
  events: ShowUpEvent[];
  activeEvent: ShowUpEvent | null;
  registrants: ShowUpRegistrant[];
  now: number;
  onSelectEvent: (eventId: string) => void;
  onNewWebinar: () => void;
  onCleanEmptyTests: () => void;
  emptyCount: number;
}

export function EventSwitcher({
  events,
  activeEvent,
  registrants,
  now,
  onSelectEvent,
  onNewWebinar,
  onCleanEmptyTests,
  emptyCount,
}: EventSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Focus search input when open
  useEffect(() => {
    if (open && events.length > 4) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open, events.length]);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Map registrant counts by eventId
  const regCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of registrants) {
      map.set(r.event_id, (map.get(r.event_id) || 0) + 1);
    }
    return map;
  }, [registrants]);

  const activeLifecycle = activeEvent ? deriveLifecycle(activeEvent, now) : "zero";

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events;
    const q = search.toLowerCase().trim();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.slug && e.slug.toLowerCase().includes(q))
    );
  }, [events, search]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[13px] font-medium transition select-none",
          open
            ? "bg-white/[0.08] border-white/[0.2] text-white shadow-sm"
            : "bg-white/[0.04] border-white/[0.08] text-slate-200 hover:text-white hover:border-white/[0.15] hover:bg-white/[0.06]"
        )}
      >
        {/* Status Dot */}
        {activeEvent && (
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              activeLifecycle === "live" && "bg-emerald-400 animate-pulse",
              activeLifecycle === "scheduled" && "bg-blue-400",
              activeLifecycle === "finished" && "bg-slate-500",
              activeLifecycle === "zero" && "bg-amber-400"
            )}
          />
        )}

        <span className="max-w-[150px] sm:max-w-[220px] md:max-w-[280px] truncate text-left">
          {activeEvent?.title || "Select webinar…"}
        </span>

        <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 shrink-0 ml-0.5" />
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 z-50 w-[300px] sm:w-[360px] rounded-xl bg-[#13161c] border border-white/[0.1] shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col"
          >
            {/* Header / Search */}
            <div className="p-2.5 border-b border-white/[0.06] bg-[#0f1117]/80">
              {events.length > 4 ? (
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search webinars…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md pl-8 pr-2.5 py-1 text-[12px] text-white placeholder-slate-500 focus:outline-none focus:border-[#1877f2]"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                  <span>Webinars</span>
                  <span className="font-mono text-slate-500">
                    {events.length} {events.length === 1 ? "room" : "rooms"}
                  </span>
                </div>
              )}
            </div>

            {/* Event List */}
            <div className="max-h-[300px] overflow-y-auto py-1 divide-y divide-white/[0.03]">
              {filteredEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-slate-500">
                  No webinars match &quot;{search}&quot;
                </div>
              ) : (
                filteredEvents.map((ev) => {
                  const isSelected = ev.id === activeEvent?.id;
                  const lifecycle = deriveLifecycle(ev, now);
                  const count = regCounts.get(ev.id) || 0;

                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        onSelectEvent(ev.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-white/[0.04] transition group",
                        isSelected && "bg-white/[0.06]"
                      )}
                    >
                      <div className="mt-1 shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-[#1877f2] flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "inline-block w-2 h-2 rounded-full mt-1 ml-1",
                              lifecycle === "live" && "bg-emerald-400 animate-pulse",
                              lifecycle === "scheduled" && "bg-blue-400",
                              lifecycle === "finished" && "bg-slate-600",
                              lifecycle === "zero" && "bg-amber-400"
                            )}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={cn(
                              "text-[13px] font-medium truncate",
                              isSelected
                                ? "text-white font-semibold"
                                : "text-slate-200 group-hover:text-white"
                            )}
                          >
                            {ev.title}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                              lifecycle === "live" &&
                                "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                              lifecycle === "scheduled" &&
                                "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                              lifecycle === "finished" &&
                                "bg-slate-700/40 text-slate-400 border border-slate-700/60",
                              lifecycle === "zero" &&
                                "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}
                          >
                            {lifecycle === "live" ? "Live" : lifecycle}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
                            {fmtEat(ev.starts_at, { date: true })}
                          </span>
                          <span className="flex items-center gap-1 shrink-0 text-slate-400">
                            <Users className="w-3 h-3 text-slate-500 shrink-0" />
                            {count} {count === 1 ? "lead" : "leads"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-1.5 border-t border-white/[0.08] bg-[#0f1117] flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onNewWebinar();
                }}
                className="w-full text-left px-2.5 py-2 rounded-lg text-[12px] font-medium text-slate-200 hover:text-white hover:bg-white/[0.05] transition flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-[#1877f2]" />
                <span>New webinar</span>
              </button>

              {emptyCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCleanEmptyTests();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-[12px] font-medium text-amber-400 hover:text-amber-300 hover:bg-amber-500/[0.08] transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300" />
                    <span>Clean up empty test events</span>
                  </span>
                  <span className="font-mono text-[10.5px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300">
                    {emptyCount}
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
