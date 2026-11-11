import { captureOrder, getOrder } from "@/lib/paypal";

export const dynamic = "force-dynamic";

export default async function Paid({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) return <p className="p-6">Missing payment reference.</p>;

  let status = "UNKNOWN";
  try {
    status = (await getOrder(token)).status;
    if (status === "APPROVED") {
      status = (await captureOrder(token)).status;
    }
  } catch {
    try {
      status = (await getOrder(token)).status;
    } catch {}
  }

  return (
    <main className="p-6 text-center">
      {status === "COMPLETED" ? (
        <>
          <h1 className="text-2xl font-bold">Payment received ✅</h1>
          <p className="mt-2">Thank you. The shopkeeper has been paid.</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Payment not completed</h1>
          <p className="mt-2">Status: {status}. Please try again.</p>
        </>
      )}
    </main>
  );
}