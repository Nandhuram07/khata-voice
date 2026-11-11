"use client";
import { useEffect, useState } from "react";
import { api, ApiError, setKey } from "@/lib/api";
import ErrorNote from "./ErrorNote";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const phrases = [
  "Ravi-ku 450 rupees, Friday-kku",
  "ரவிக்கு 200 ரூபாய், சனிக்கிழமை",
  "Suresh owes 800 by Monday",
  "Priya-ku 1200 rupees, next week",
];

const bars = [14, 26, 18, 32, 20, 28, 16, 24];

function Scene() {
  const stripes = Array.from({ length: 8 });
  return (
    <div className="relative mx-auto w-full max-w-md">
      <svg viewBox="0 0 480 300" className="w-full" role="img" aria-label="A shopkeeper speaking a payment into his phone outside a shop">
        <ellipse cx="240" cy="160" rx="225" ry="135" fill="#f3e6cc" />
        <rect x="20" y="258" width="440" height="22" rx="11" fill="#cfe3c8" />

        {/* shop */}
        <rect x="120" y="110" width="240" height="150" rx="12" fill="#fffdf7" stroke="#e6d6b8" strokeWidth="2" />
        {stripes.map((_, i) => (
          <g key={i} fill={i % 2 ? "#fffdf7" : "#c8643b"}>
            <rect x={110 + i * 32.5} y="78" width="32.5" height="42" />
            <circle cx={126.25 + i * 32.5} cy="120" r="16.25" />
          </g>
        ))}
        <rect x="185" y="48" width="110" height="26" rx="7" fill="#2f6b3f" />
        <text x="240" y="66" textAnchor="middle" fontSize="14" fontWeight="700" fill="#fffdf7">KHATA</text>
        <rect x="140" y="150" width="70" height="62" rx="6" fill="#e1efdd" stroke="#e6d6b8" strokeWidth="2" />
        <rect x="270" y="150" width="70" height="62" rx="6" fill="#e1efdd" stroke="#e6d6b8" strokeWidth="2" />
        <rect x="222" y="170" width="36" height="90" rx="5" fill="#2f6b3f" />
        <circle cx="251" cy="218" r="2.5" fill="#fffdf7" />

        {/* trees */}
        <rect x="41" y="206" width="8" height="54" fill="#8a5a3c" />
        <circle cx="45" cy="196" r="34" fill="#2f6b3f" opacity="0.9" />
        <circle cx="62" cy="214" r="18" fill="#3f8a53" opacity="0.9" />
        <rect x="446" y="216" width="8" height="44" fill="#8a5a3c" />
        <circle cx="450" cy="208" r="28" fill="#2f6b3f" opacity="0.9" />

        {/* shopkeeper */}
        <rect x="376" y="212" width="38" height="50" rx="12" fill="#2f6b3f" />
        <circle cx="395" cy="196" r="16" fill="#e0a77a" />
        <path d="M379 193a16 14 0 0 1 32 0z" fill="#2b2a22" />
        <path d="M387 203q8 5 16 0" stroke="#2b2a22" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <rect x="364" y="226" width="12" height="20" rx="3" fill="#2b2a22" />

        {/* speech bubble */}
        <rect x="318" y="22" width="150" height="50" rx="16" fill="#fffdf7" stroke="#e6d6b8" strokeWidth="2" />
        <path d="M380 72l10 16 8-16z" fill="#fffdf7" stroke="#e6d6b8" strokeWidth="2" strokeLinejoin="round" />
        <rect x="378" y="70" width="22" height="4" fill="#fffdf7" />
        {bars.map((h, i) => (
          <rect
            key={i}
            x={338 + i * 14}
            y={47 - h / 2}
            width="6"
            height={h}
            rx="3"
            fill="#2f6b3f"
            className="animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </svg>

      <span
        className="absolute left-2 top-6 animate-bounce rounded-full border bg-card px-3 py-1 text-sm font-semibold shadow-sm"
        style={{ animationDuration: "3.2s" }}
      >
        $450 · Pending
      </span>
      <span
        className="absolute bottom-10 left-6 animate-bounce rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground shadow-sm"
        style={{ animationDuration: "3.8s" }}
      >
        Paid ✓
      </span>
    </div>
  );
}

export default function Gate({ onOpen }: { onOpen: () => void }) {
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % phrases.length), 3200);
    return () => clearInterval(t);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setKey(value.trim());
    try {
      await api("/api/invoices"); // cheap authenticated call to verify the key
      onOpen();
    } catch (err) {
      setKey("");
      setError(err as ApiError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-2">
      <section>
        <Scene />
        <div className="mx-auto mt-6 max-w-md text-center">
          <p className="text-sm font-medium text-muted-foreground">Try saying</p>
          <p key={idx} className="mt-1 rounded-2xl bg-secondary px-4 py-3 text-lg animate-in fade-in duration-500">
            &ldquo;{phrases[idx]}&rdquo;
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <h1 className="text-4xl font-bold lg:text-5xl">
          Welcome to <span className="text-primary">Khata Voice</span>
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">Speak payments. Grow your business.</p>

        <form onSubmit={submit} className="mt-6 rounded-2xl border bg-card p-5 shadow-sm">
          <Label htmlFor="key">Access key</Label>
          <div className="relative mt-2">
            <Input
              id="key"
              type={show ? "text" : "password"}
              autoComplete="off"
              placeholder="Enter your access key"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-12 pr-16 text-base"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-primary"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <Button
            type="submit"
            disabled={busy || value.length < 12}
            className="mt-4 h-12 w-full text-base font-semibold transition-transform hover:-translate-y-0.5"
          >
            {busy ? "Checking…" : "Continue →"}
          </Button>
          <ErrorNote error={error} />
        </form>

        <ul className="mt-5 flex flex-wrap gap-2 text-sm">
          {["Tamil + English voice", "AI reads your entry", "Paid via PayPal"].map((t) => (
            <li key={t} className="rounded-full border bg-card px-3 py-1 text-muted-foreground">
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-muted-foreground">Powered by PayPal · sandbox payments only</p>
      </section>
    </main>
  );
}