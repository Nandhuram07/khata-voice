"use client";
import { useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Parsed, Sent } from "@/lib/types";
import ErrorNote from "./ErrorNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ConfirmCard({
  initial, onSent, onCancel,
}: { initial: Parsed; onSent: (s: Sent) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial.customer_name);
  const [amount, setAmount] = useState(String(initial.amount));
  const [due, setDue] = useState(initial.due_date);
  const [note, setNote] = useState(initial.note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const idem = useRef(crypto.randomUUID());

  const valid = name.trim() && Number(amount) > 0 && due && note.trim();

  async function send() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<Sent>("/api/invoices", {
        method: "POST",
        idem: idem.current,
        body: { customer_name: name, amount: Number(amount), due_date: due, note },
      });
      onSent(res);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const initialLetter = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <section>
      <h2 className="mt-6 text-center text-2xl font-bold">Confirm Your Payment</h2>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Fix anything that&apos;s wrong, then create the link.
      </p>

      <div className="mt-5 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {initialLetter}
          </div>
          <div className="min-w-0 flex-1">
            <Label htmlFor="c-name" className="text-xs text-muted-foreground">Customer</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} className="h-10 text-base font-semibold" />
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <div>
            <Label htmlFor="c-amount" className="text-xs text-muted-foreground">Amount (USD)</Label>
            <Input id="c-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-10 text-base" />
          </div>
          <div>
            <Label htmlFor="c-due" className="text-xs text-muted-foreground">Due date</Label>
            <Input id="c-due" type="date" value={due} onChange={(e) => setDue(e.target.value)} className="h-10 text-base" />
          </div>
          <div>
            <Label htmlFor="c-note" className="text-xs text-muted-foreground">Note</Label>
            <Input id="c-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={100} className="h-10 text-base" />
          </div>
        </div>
      </div>

      <ErrorNote error={error} />

      <Button onClick={send} disabled={busy || !valid} className="mt-5 h-12 w-full text-base font-semibold">
        {busy ? "Creating…" : "Create payment link →"}
      </Button>
      <Button onClick={onCancel} disabled={busy} variant="ghost" className="mt-2 h-11 w-full">
        Start over
      </Button>
      <p className="mt-4 text-center text-xs text-muted-foreground">Secure &amp; powered by PayPal</p>
    </section>
  );
}