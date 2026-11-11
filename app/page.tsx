"use client";
import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Parsed, Sent } from "@/lib/types";
import Gate from "@/components/Gate";
import Recorder from "@/components/Recorder";
import ConfirmCard from "@/components/ConfirmCard";
import Ledger from "@/components/Ledger";
import ErrorNote from "@/components/ErrorNote";
import Showcase from "@/components/ShowCase";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"new" | "ledger">("new");
  const [step, setStep] = useState<"entry" | "confirm" | "sent">("entry");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [sent, setSent] = useState<Sent | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [copied, setCopied] = useState(false);

  if (!authed) return <Gate onOpen={() => setAuthed(true)} />;

  async function parse(utterance: string) {
    setBusy(true);
    setError(null);
    try {
      setParsed(await api<Parsed>("/api/parse", { method: "POST", body: { utterance } }));
      setStep("confirm");
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setBusy(false);
    }
  }

  const reset = () => {
    setStep("entry");
    setParsed(null);
    setSent(null);
    setError(null);
    setCopied(false);
  };

  async function copyLink(link: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this payment link:", link);
    }
  }

  const tabBtn = (id: "new" | "ledger", label: string) => (
    <button
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`flex-1 border-b-2 py-3 text-base font-medium ${
        tab === id ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-6 lg:grid-cols-[1fr_28rem] lg:items-start">
      <div className="order-2 lg:order-1 lg:pt-6">
        <Showcase />
      </div>

    <main className="order-1 w-full max-w-md justify-self-center rounded-3xl border bg-card/60 p-5 shadow-sm lg:order-2 lg:self-center">        <header className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold">Khata Voice</h1>
        </header>

        <nav className="mt-4 flex border-b" aria-label="Sections">
          {tabBtn("new", "New entry")}
          {tabBtn("ledger", "Ledger")}
        </nav>

        {tab === "ledger" && <Ledger />}

        {tab === "new" && step === "entry" && (
          <>
            <Recorder onSubmit={parse} busy={busy} />
            <ErrorNote error={error} />
          </>
        )}

        {tab === "new" && step === "confirm" && parsed && (
          <ConfirmCard
            initial={parsed}
            onCancel={reset}
            onSent={(s) => { setSent(s); setStep("sent"); }}
          />
        )}

        {tab === "new" && step === "sent" && sent && (
          <section className="mt-10 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
            </div>
            <h2 className="mt-5 text-3xl font-bold">Payment link ready!</h2>
            <p className="mt-2 text-muted-foreground">
              Send this link to your customer. They pay with PayPal.
            </p>

            {sent.pay_link && (
              <div className="mt-6 grid gap-3">
                <a
                  href={sent.pay_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Open payment page
                </a>
                <Button onClick={() => copyLink(sent.pay_link!)} variant="outline" className="h-12 text-base">
                  {copied ? "Link copied" : "Copy payment link"}
                </Button>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Button onClick={reset} variant="secondary" className="h-12">Add another</Button>
              <Button onClick={() => { reset(); setTab("ledger"); }} variant="secondary" className="h-12">
                Back to Ledger
              </Button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}