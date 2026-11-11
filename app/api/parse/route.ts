import { guard, readJson } from "@/lib/security";
import { ParseInput } from "@/lib/schemas";
import { extractInvoice } from "@/lib/extract";

export const POST = guard({ name: "parse", limit: 10 }, async (req) => {
  const { utterance } = ParseInput.parse(await readJson(req));
  return extractInvoice(utterance);
});