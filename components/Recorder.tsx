"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Recorder({ onSubmit, busy }: { onSubmit: (text: string) => void; busy: boolean }) {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<"ta-IN" | "en-IN">("ta-IN");
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const recRef = useRef<any>(null);

  function toggle() {
    if (listening) { recRef.current?.stop(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setNote("Voice isn't supported in this browser. Type the entry below."); return; }
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) =>
      setText(Array.from(e.results).map((r: any) => r[0].transcript).join(" "));
    rec.onerror = (e: any) => {
      setNote(
        e.error === "not-allowed"
          ? "Allow microphone access in your browser settings."
          : "Couldn't hear that. Tap the mic again or type the entry."
      );
      setListening(false);
    };
    rec.onend = () => setListening(false);
    setNote("");
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return (
    <section>
      <h2 className="mt-6 text-center text-2xl font-bold">Speak Your Payment</h2>

      <div className="mt-6 flex flex-col items-center">
        <div className="flex h-36 w-36 items-center justify-center rounded-full bg-secondary">
          <button
            onClick={toggle}
            aria-label={listening ? "Stop listening" : "Start listening"}
            aria-pressed={listening}
            className={`flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ${listening ? "listening" : ""}`}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        </div>

        <p className="mt-3 font-medium" aria-live="polite">
          {listening ? "Listening…" : "Tap to speak"}
        </p>
        <p className="text-sm text-muted-foreground">or type below</p>

        {listening && (
          <div className="mt-3 flex h-8 items-end gap-1" aria-hidden>
            {[40, 75, 55, 90, 60, 80, 45, 70, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 animate-pulse rounded-full bg-primary"
                style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-2" role="group" aria-label="Speech language">
          {(["ta-IN", "en-IN"] as const).map((l) => (
            <Button
              key={l}
              type="button"
              size="sm"
              variant={lang === l ? "default" : "outline"}
              aria-pressed={lang === l}
              onClick={() => setLang(l)}
              className="rounded-full px-4"
            >
              {l === "ta-IN" ? "தமிழ்" : "English"}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border bg-card p-4 shadow-sm">
        <Label htmlFor="entry">Entry</Label>
        <Textarea
          id="entry"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={300}
          placeholder="Ravi-ku 450 rupees, Friday-kku"
          className="mt-2 text-base"
        />
        {note && <p className="mt-2 text-sm text-destructive">{note}</p>}
      </div>

      <Button
        onClick={() => onSubmit(text)}
        disabled={busy || text.trim().length < 3}
        className="mt-5 h-12 w-full text-base font-semibold"
      >
        {busy ? "Reading your entry…" : "Create payment request"}
      </Button>
    </section>
  );
}