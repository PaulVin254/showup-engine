"use client";

import React, { useMemo, useState } from "react";
import { Copy, Download, Plus, Search } from "lucide-react";
import { ShowUpEvent, ShowUpRegistrant } from "@/lib/types";
import { fmtEat, relativeAgo } from "@/lib/lifecycle";
import { formatPhoneDisplay, normalizeKenyanPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";
import { Button, Sheet, StatusPill, inputCls } from "@/components/ui/kit";
import { SOURCE_LABEL } from "./CommandCenter";

interface RegistrantsSheetProps {
  open: boolean;
  onClose: () => void;
  event: ShowUpEvent;
  registrants: ShowUpRegistrant[];
  now: number;
  origin: string;
  adding: boolean;
  onAdd: (name: string, phone: string) => Promise<boolean>;
  onExport: () => void;
  onToast: (msg: string) => void;
}

export function RegistrantsSheet({
  open,
  onClose,
  event,
  registrants,
  now,
  origin,
  adding,
  onAdd,
  onExport,
  onToast,
}: RegistrantsSheetProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "joined" | "waiting">("all");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const normalized = normalizeKenyanPhone(phone);
  const phoneInvalid = phone.trim().length > 3 && !normalized;

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return registrants.filter((r) => {
      const att = r.clicked_join_link || r.zoom_verified;
      if (filter === "joined" && !att) return false;
      if (filter === "waiting" && att) return false;
      if (!needle) return true;
      return r.full_name.toLowerCase().includes(needle) || r.phone_e164.includes(needle.replace(/\D/g, "") || "§");
    });
  }, [registrants, q, filter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !normalized) return;
    if (await onAdd(name.trim(), phone)) {
      setName("");
      setPhone("");
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Registrants"
      description={`${registrants.length} for ${event.title}`}
      width="max-w-2xl"
      footer={
        <>
          <span className="text-[11px] text-slate-500">CSV includes attendance flags</span>
          <Button size="sm" onClick={onExport} icon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>
        </>
      }
    >
      <form
        onSubmit={submit}
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 px-4 sm:px-5 py-4 border-b border-white/[0.08] items-start"
      >
        <input
          required
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
        <div>
          <input
            required
            type="tel"
            placeholder="0712 345 678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={cn(inputCls, "font-mono tabular-nums", phoneInvalid && "border-red-500/60")}
          />
          <div className="mt-1 h-3.5 text-[10.5px] font-mono tabular-nums text-slate-500">
            {normalized ? `→ +${normalized}` : phoneInvalid ? "Not a valid Kenyan number" : ""}
          </div>
        </div>
        <Button type="submit" variant="brand" loading={adding} disabled={!name.trim() || !normalized} icon={<Plus className="w-3.5 h-3.5" />}>
          Add
        </Button>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 sm:px-5 py-3 border-b border-white/[0.08]">
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Search name or number"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className={cn(inputCls, "pl-8")}
          />
        </div>
        <div className="inline-flex self-start sm:self-auto p-0.5 rounded-md bg-white/[0.04] border border-white/[0.08]">
          {(["all", "joined", "waiting"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-7 px-2.5 rounded text-[12px] capitalize transition",
                filter === f ? "bg-white/[0.1] text-white" : "text-slate-500 hover:text-slate-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead className="text-left text-[11px] uppercase tracking-wider text-slate-500">
            <tr className="border-b border-white/[0.08]">
              <th className="px-4 sm:px-5 py-2 font-medium">Name</th>
              <th className="px-2 py-2 font-medium">WhatsApp</th>
              <th className="px-2 py-2 font-medium hidden sm:table-cell">Added</th>
              <th className="px-2 py-2 font-medium">Status</th>
              <th className="px-4 sm:px-5 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const att = r.clicked_join_link || r.zoom_verified;
              return (
                <tr key={r.id} className="border-b border-white/[0.05] hover:bg-white/[0.02] group">
                  <td className="px-4 sm:px-5 py-2.5 max-w-[130px] sm:max-w-none">
                    <div className="text-white font-medium truncate">{r.full_name}</div>
                    <div className="text-[11px] text-slate-500">{SOURCE_LABEL[r.source]}</div>
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums text-slate-400 whitespace-nowrap">{formatPhoneDisplay(r.phone_e164)}</td>
                  <td className="px-2 py-2.5 text-slate-500 hidden sm:table-cell font-mono tabular-nums">
                    {relativeAgo(r.created_at, now)}
                  </td>
                  <td className="px-2 py-2.5">
                    {r.opted_out ? (
                      <StatusPill tone="red" dot={false}>Opted out</StatusPill>
                    ) : att ? (
                      <StatusPill tone="emerald">
                        Joined{r.joined_at ? ` ${fmtEat(r.joined_at)}` : ""}
                      </StatusPill>
                    ) : (
                      <StatusPill tone="slate">Reminded</StatusPill>
                    )}
                  </td>
                  <td className="px-4 sm:px-5 py-2.5 text-right">
                    <button
                      type="button"
                      title="Copy personal join link"
                      onClick={() => {
                        navigator.clipboard.writeText(`${origin}/j/${r.tracking_token}`);
                        onToast("Personal join link copied");
                      }}
                      className="p-1 rounded text-slate-600 hover:text-white hover:bg-white/[0.06] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                  No registrants match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Sheet>
  );
}

