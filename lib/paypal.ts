import "server-only";
import { env } from "./env";
import { fetchJson } from "./http";
import { AppError, log } from "./security";
import type { InvoiceData } from "./schemas";

export const BASE = "https://api-m.sandbox.paypal.com";

/* token cached until near expiry; concurrent callers share one request */
let cached: { value: string; exp: number } | null = null;
let pending: Promise<string> | null = null;

export async function token(): Promise<string> {
  if (cached && cached.exp > Date.now() + 30_000) return cached.value;
  pending ??= (async () => {
    const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`).toString("base64");
    const r = await fetchJson(
      `${BASE}/v1/oauth2/token`,
      {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: "grant_type=client_credentials",
      },
      { retries: 2 }
    );
    if (!r.ok) {
      log("error", "paypal_auth_failed", { status: r.status });
      throw new AppError(502, "PAYPAL_AUTH", "Payment provider unavailable.");
    }
    cached = { value: r.body.access_token, exp: Date.now() + r.body.expires_in * 1000 };
    return cached.value;
  })().finally(() => (pending = null));
  return pending;
}
/* eslint-disable @typescript-eslint/no-explicit-any */
async function pp(path: string, init: RequestInit = {}, opts: { retries?: number } = {}, again = true): Promise<any> {
  const t = await token();
  const r = await fetchJson(
    `${BASE}${path}`,
   // { ...init, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", ...(init.headers ?? {}) } },
      { ...init, headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) } },
      opts
  );
  if (r.status === 401 && again) {
    cached = null; // token revoked/expired early: refresh once
    return pp(path, init, opts, false);
  }
  if (!r.ok) {
    // full detail goes to logs only; the client gets a generic message
    log("error", "paypal_error", {
      path: path.replace(/INV2-[A-Z0-9-]+/, "INV2-*"),
      status: r.status,
      name: r.body?.name,
      message: r.body?.message,
      details: JSON.stringify(r.body?.details ?? "").slice(0, 300),
      debug_id: r.body?.debug_id,
    });
    throw new AppError(502, "PAYPAL_ERROR", "The payment provider rejected the request. Please try again.");
  }
  return r.body;
}

export async function createAndSendInvoice(p: InvoiceData) {
  const [given, ...rest] = p.customer_name.split(/\s+/);
  const draft = await pp("/v2/invoicing/invoices", {
    method: "POST",
    body: JSON.stringify({
      detail: {
        currency_code: env.PAYPAL_CURRENCY,
        note: p.note,
        payment_term: { term_type: "DUE_ON_DATE_SPECIFIED", due_date: p.due_date },
      },
      primary_recipients: [
        {
          billing_info: {
            name: { given_name: given, surname: rest.join(" ") || "-" },
            email_address: env.DEMO_CUSTOMER_EMAIL,
          },
        },
      ],
      items: [
        {
          name: p.note,
          quantity: "1",
          unit_amount: { currency_code: env.PAYPAL_CURRENCY, value: p.amount.toFixed(2) },
        },
      ],
    }),
  });

  const id = String(draft.href).split("/").pop()!;
  try {
    await pp(`/v2/invoicing/invoices/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ send_to_recipient: true, send_to_invoicer: false }),
    });
  } catch (e) {
    // don't leave an orphaned draft behind
    await pp(`/v2/invoicing/invoices/${id}`, { method: "DELETE" }).catch(() => {});
    throw e;
  }
  const full = await pp(`/v2/invoicing/invoices/${id}`, {}, { retries: 2 });
  return { id, status: full.status, payer_link: full.detail?.metadata?.recipient_view_url };
}

export async function getInvoice(id: string) {
  const i = await pp(`/v2/invoicing/invoices/${id}`, {}, { retries: 2 });
  return {
    id: i.id as string,
    customer: i.primary_recipients?.[0]?.billing_info?.name?.given_name as string,
    amount: Number(i.amount?.value),
    due: i.detail?.payment_term?.due_date as string,
    status: i.status as string,
  };
}

export async function listInvoices() {
  const d = await pp("/v2/invoicing/invoices?page=1&page_size=20&total_required=true", {}, { retries: 2 });
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (d.items ?? []).map((i: any) => ({
    id: i.id,
    status: i.status,
    customer: i.primary_recipients?.[0]?.billing_info?.name?.given_name,
    amount: i.amount?.value,
    due: i.detail?.payment_term?.due_date,
  }));
}

export async function sendReminder(id: string, note: string) {
  await pp(`/v2/invoicing/invoices/${id}/remind`, {
    method: "POST",
    body: JSON.stringify({ subject: "Payment reminder", note, send_to_invoicer: false }),
  });
}

export async function createOrder(p: InvoiceData, returnBase: string) {
    const o = await pp("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            description: p.note.slice(0, 120),
            custom_id: p.customer_name.slice(0, 120),
            amount: { currency_code: env.PAYPAL_CURRENCY, value: p.amount.toFixed(2) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: `${returnBase}/paid`,
              cancel_url: `${returnBase}/cancelled`,
              user_action: "PAY_NOW",
            },
          },
        },
      }),
    });
    const link = (o.links ?? []).find((l: any) => l.rel === "payer-action" || l.rel === "approve");
    return { id: o.id as string, status: o.status as string, pay_link: link?.href as string };
  }
  
  export async function captureOrder(id: string) {
    const c = await pp(`/v2/checkout/orders/${encodeURIComponent(id)}/capture`, { method: "POST", body: "{}" });
    return { id: c.id as string, status: c.status as string };
  }
  
  export async function getOrder(id: string) {
    const o = await pp(`/v2/checkout/orders/${encodeURIComponent(id)}`, {}, { retries: 2 });
    return {
      id: o.id as string,
      status: o.status as string,
      amount: Number(o.purchase_units?.[0]?.amount?.value),
      customer: o.purchase_units?.[0]?.custom_id as string,
      note: o.purchase_units?.[0]?.description as string,
    };
  }

  export async function listOrderStatuses(ids: string[]) {
    const results = await Promise.all(
      ids.map((id) => getOrder(id).catch(() => null))
    );
    return results.filter((o): o is NonNullable<typeof o> => o !== null);
  }
