"use client";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Row } from "@/lib/types";
import ErrorNote from "./ErrorNote";
import { Button } from "@/components/ui/button";

const STATUS: Record<string, { label: string; paid?: boolean; open?: boolean }> = {
  COMPLETED: { label: "Paid", paid: true },
  APPROVED: { label: "Approved", open: true },
  PAYER_ACTION_REQUIRED: { label: "Pending", open: true },
  CREATED: { label: "Pending", open: true },
  VOIDED: { label: "Cancelled" },
  UNKNOWN: { label: "Unknown" },
};

type Filter = "all" | "pending" | "paid";

export default function Ledger() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      setRows(await api<Row[]>("/api/invoices"));
      setError(null);
    } catch (e) {
      setError(e as ApiError);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(() => { if (!document.hidden) load(); }, 15000); // pick up "Paid" without a refresh
    return () => clearInterval(t);
  }, [load]);

  async function copy(id: string, link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(id);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt("Copy this payment link:", link);
    }
  }

    // Totals use ALL rows, so they don't change when a filter pill is selected.
  const totals = (rows ?? []).reduce(
    (acc, r) => {
      const s = STATUS[r.status];
      const amt = Number(r.amount) || 0;
      if (s?.paid) { acc.paid.sum += amt; acc.paid.count += 1; }
      else if (s?.open) { acc.pending.sum += amt; acc.pending.count += 1; }
      return acc; // cancelled/unknown rows are left out of both totals
    },
    { pending: { sum: 0, count: 0 }, paid: { sum: 0, count: 0 } }
  );

  const money = (n: number) =>
    `$${n.toLocaleString("en-US", {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;

  const entries = (n: number) => `${n} ${n === 1 ? "entry" : "entries"}`;

  const shown = (rows ?? []).filter((r) => {
    const s = STATUS[r.status];
    if (filter === "paid") return s?.paid;
    if (filter === "pending") return s?.open;
    return true;
  });

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "paid", label: "Paid" },
  ];

  return (
    <section className="mt-6">
      <h2 className="text-2xl font-bold">Your Payment Ledger</h2>
            <div className="mt-4 grid grid-cols-2 gap-3" role="group" aria-label="Ledger totals">
        <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "var(--wait-bg)" }}>
          <p className="text-sm text-muted-foreground">Total pending</p>
          <p className="mt-1 text-xl font-bold">{rows === null ? "—" : money(totals.pending.sum)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{entries(totals.pending.count)}</p>
        </div>
        <div className="rounded-2xl border p-4 shadow-sm" style={{ background: "var(--paid-bg)" }}>
          <p className="text-sm text-muted-foreground">Total paid</p>
          <p className="mt-1 text-xl font-bold" style={{ color: "var(--paid)" }}>
            {rows === null ? "—" : money(totals.paid.sum)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{entries(totals.paid.count)}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-2" role="group" aria-label="Filter entries">
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className="rounded-full px-4"
          >
            {f.label}
          </Button>
        ))}
      </div>

      <ErrorNote error={error} />
      {rows === null && !error && <p className="mt-6 text-muted-foreground">Loading your ledger…</p>}
      {rows !== null && shown.length === 0 && (
        <p className="mt-6 text-muted-foreground">
          {rows.length === 0 ? "No entries yet. Add your first one in the New entry tab." : "Nothing here yet."}
        </p>
      )}

      <ul className="mt-4 space-y-3">
        {shown.map((r) => {
          const s = STATUS[r.status] ?? { label: r.status };
          return (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-sm">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-bold">
                {(r.customer ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-semibold">{r.customer ?? "Customer"}</p>
                <p className="text-sm text-muted-foreground">{r.due ? `Due ${r.due}` : ""}</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <p className="text-lg font-bold">${r.amount}</p>
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={{
                    background: s.paid ? "var(--paid-bg)" : "var(--wait-bg)",
                    color: s.paid ? "var(--paid)" : "var(--foreground)",
                  }}
                >
                  {s.label}
                </span>
                {s.open && r.pay_link && (
                  <button
                    onClick={() => copy(r.id, r.pay_link!)}
                    className="text-xs font-medium text-accent underline"
                  >
                    {copied === r.id ? "Link copied" : "Copy link"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}