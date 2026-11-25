"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
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

  useEffect(() => {
    if (open && events.length > 4) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [open, events.length]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

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
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-full border text-[13px] font-medium transition select-none",
          open
            ? "bg-neutral-200/80 border-neutral-300 text-[#111111]"
            : "bg-[#f4f4f5] border-neutral-200 text-[#111111] hover:bg-neutral-200/70"
        )}
      >
        {activeEvent && (
          <span
            className={cn(
              "w-2 h-2 rounded-full shrink-0",
              activeLifecycle === "live" && "bg-[#00a884] animate-pulse",
              activeLifecycle === "scheduled" && "bg-[#1877f2]",
              activeLifecycle === "finished" && "bg-neutral-400",
              activeLifecycle === "zero" && "bg-amber-500"
            )}
          />
        )}

        <span className="max-w-[150px] sm:max-w-[220px] md:max-w-[280px] truncate text-left">
          {activeEvent?.title || "Select webinar..."}
        </span>

        <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#111111] shrink-0 ml-0.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 top-full mt-1.5 z-50 w-[300px] sm:w-[360px] rounded-2xl bg-white border border-neutral-200 shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-2.5 border-b border-neutral-100 bg-[#fafafa]">
              {events.length > 4 ? (
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search webinars..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-neutral-200 rounded-lg pl-8 pr-2.5 py-1.5 text-[12px] text-[#111111] placeholder-neutral-400 focus:outline-none focus:border-[#111111]"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold tracking-wider uppercase text-neutral-500">
                  <span>Webinars</span>
                  <span className="font-mono text-neutral-400">
                    {events.length} {events.length === 1 ? "room" : "rooms"}
                  </span>
                </div>
              )}
            </div>

            <div className="max-h-[300px] overflow-y-auto py-1 divide-y divide-neutral-100">
              {filteredEvents.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-neutral-500">
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
                        "w-full text-left px-3 py-2.5 flex items-start gap-2.5 hover:bg-[#f4f4f5] transition group",
                        isSelected && "bg-[#f4f4f5]/80"
                      )}
                    >
                      <div className="mt-1 shrink-0">
                        {isSelected ? (
                          <div className="w-4 h-4 rounded-full bg-[#111111] flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <span
                            className={cn(
                              "inline-block w-2 h-2 rounded-full mt-1 ml-1",
                              lifecycle === "live" && "bg-[#00a884] animate-pulse",
                              lifecycle === "scheduled" && "bg-[#1877f2]",
                              lifecycle === "finished" && "bg-neutral-400",
                              lifecycle === "zero" && "bg-amber-500"
                            )}
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <span
                            className={cn(
                              "text-[13px] font-medium truncate text-[#111111]",
                              isSelected && "font-semibold"
                            )}
                          >
                            {ev.title}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 border",
                              lifecycle === "live" &&
                                "bg-emerald-50 text-emerald-700 border-emerald-200",
                              lifecycle === "scheduled" &&
                                "bg-blue-50 text-blue-700 border-blue-200",
                              lifecycle === "finished" &&
                                "bg-neutral-100 text-neutral-600 border-neutral-200",
                              lifecycle === "zero" &&
                                "bg-amber-50 text-amber-800 border-amber-200"
                            )}
                          >
                            {lifecycle === "live" ? "Live" : lifecycle}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500 font-mono">
                          <span className="flex items-center gap-1 truncate">
                            <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                            {fmtEat(ev.starts_at, { date: true })}
                          </span>
                          <span className="flex items-center gap-1 shrink-0 text-neutral-500">
                            <Users className="w-3 h-3 text-neutral-400 shrink-0" />
                            {count} {count === 1 ? "lead" : "leads"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-1.5 border-t border-neutral-200 bg-[#fafafa] flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onNewWebinar();
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-[12px] font-medium text-[#111111] hover:bg-neutral-200/60 transition flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5 text-[#111111]" />
                <span>New webinar</span>
              </button>

              {emptyCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onCleanEmptyTests();
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-xl text-[12px] font-medium text-amber-800 hover:bg-amber-100/70 transition flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-amber-700" />
                    <span>Clean up empty test events</span>
                  </span>
                  <span className="font-mono text-[10.5px] bg-amber-200/70 px-2 py-0.5 rounded-full text-amber-900">
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
