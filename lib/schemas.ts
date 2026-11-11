import { z } from "zod";
import { env } from "./env";

const clean = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, "").trim();
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

const text = (min: number, max: number) => z.string().transform(clean).pipe(z.string().min(min).max(max));

export const ParseInput = z.object({ utterance: text(3, 300) });

// Used for BOTH the LLM output and the client-confirmed payload. Never trust either.
export const InvoiceData = z.object({
  customer_name: text(1, 60),
  amount: z
    .number()
    .positive()
    .max(env.MAX_INVOICE_AMOUNT)
    .transform((n) => Math.round(n * 100) / 100),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((d) => d >= isoDay(new Date()), "past date")
    .refine((d) => d <= isoDay(new Date(Date.now() + 365 * 864e5)), "too far ahead"),
  note: text(1, 100),
});
export type InvoiceData = z.infer<typeof InvoiceData>;

export const IdemKey = z.string().uuid();
export const InvoiceId = z.string().regex(/^INV2-[A-Z0-9-]{4,40}$/);
