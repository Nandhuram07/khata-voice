import { z } from "zod";
import { guard, readJson } from "@/lib/security";
import { InvoiceId } from "@/lib/schemas";
import { getInvoice, sendReminder } from "@/lib/paypal";
import { writeTamilReminder } from "@/lib/extract";

export const POST = guard({ name: "remind", limit: 5 }, async (req) => {
  const { id } = z.object({ id: InvoiceId }).parse(await readJson(req));
  const inv = await getInvoice(id);
  if (!["SENT", "UNPAID", "PARTIALLY_PAID"].includes(inv.status))
    return { ok: false, reason: `Invoice is ${inv.status}` };
  const note = await writeTamilReminder(inv.customer, inv.amount, inv.due);
  await sendReminder(id, note);
  return { ok: true, note };
});