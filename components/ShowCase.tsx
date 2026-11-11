const steps = [
  { n: "1", title: "Speak it", text: "Say who owes what, in Tamil, English or a mix." },
  { n: "2", title: "Check it", text: "AI reads the entry. You fix anything before it goes out." },
  { n: "3", title: "Get paid", text: "Send the PayPal link. The ledger turns Paid when they pay." },
];

const facts = [
  { big: "தமிழ் + EN", small: "Speak in either language" },
  { big: "~2 sec", small: "To read an entry" },
  { big: "PayPal", small: "Checkout for your customer" },
];

export default function Showcase() {
  return (
    <aside className="space-y-8">
      <div>
        <p className="inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium text-accent">
          Speak · Pay · Track
        </p>
        <h2 className="mt-4 text-4xl font-bold leading-tight lg:text-5xl">
          பேசுங்கள். <span className="text-primary">பணம் பெறுங்கள்.</span>
        </h2>
        <p className="mt-2 text-xl text-muted-foreground">
          Say a bill out loud. Get a PayPal payment link for your customer.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm" aria-label="Example">
        <p className="text-sm font-medium text-muted-foreground">You say</p>
        <p className="mt-1 rounded-xl bg-secondary px-4 py-3 text-lg">
          &ldquo;Ravi-ku 450 rupees, Friday-kku&rdquo;
        </p>
        <p className="my-2 text-center text-primary" aria-hidden>↓</p>
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">R</div>
          <div className="flex-1">
            <p className="font-semibold">Ravi</p>
            <p className="text-sm text-muted-foreground">Due Friday</p>
          </div>
          <div className="text-right">
            <p className="font-bold">450</p>
            <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: "var(--wait-bg)" }}>
              Pending
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-2xl border bg-card p-4 shadow-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {s.n}
            </span>
            <h3 className="mt-3 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 rounded-2xl bg-primary p-4 text-primary-foreground">
        {facts.map((f) => (
          <div key={f.big} className="text-center">
            <p className="text-lg font-bold sm:text-xl">{f.big}</p>
            <p className="text-xs opacity-80">{f.small}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        பேசுங்கள் · बोलिए · Speak &nbsp;✦&nbsp; Built for the PayPal AI Hackathon · sandbox payments only · AI by Gemini
      </p>
    </aside>
  );
}