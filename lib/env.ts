import "server-only";
import { z } from "zod";

const schema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  PAYPAL_CLIENT_ID: z.string().min(1),
  PAYPAL_SECRET: z.string().min(1),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
  PAYPAL_CURRENCY: z.string().length(3).default("USD"),
  DEMO_CUSTOMER_EMAIL: z.string().email(),
  DEMO_ACCESS_KEY: z.string().min(12),
  MAX_INVOICE_AMOUNT: z.coerce.number().positive().default(100000),
});

export const env = schema.parse(process.env);