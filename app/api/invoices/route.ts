import { guard, readJson, once, AppError } from "@/lib/security";
import { InvoiceData, IdemKey } from "@/lib/schemas";
import { createOrder, getOrder } from "@/lib/paypal";
import { saveOrder, allOrders } from "@/lib/store";

export const POST = guard({ name: "invoice-create", limit: 5 }, async (req) => {
  const key = IdemKey.safeParse(req.headers.get("idempotency-key"));
  if (!key.success) throw new AppError(400, "IDEMPOTENCY_KEY", "Missing idempotency key.");
  const data = InvoiceData.parse(await readJson(req)); // re-validate: the client is untrusted
  const returnBase = new URL(req.url).origin;
  return once(key.data, async () => {
    const o = await createOrder(data, returnBase);
      await saveOrder({
      id: o.id,
      customer: data.customer_name,
      amount: data.amount,
      due: data.due_date,
      note: data.note,
      pay_link: o.pay_link,
      created: Date.now(),
    });
    return o;
    return o;
  });
});

export const GET = guard({ name: "invoice-list", limit: 30 }, async () => {
  const stored = await allOrders(20);
  return Promise.all(
    stored.map(async (r) => {
      const live = await getOrder(r.id).catch(() => null);
      return { ...r, status: live?.status ?? "UNKNOWN" };
    })
  );
});