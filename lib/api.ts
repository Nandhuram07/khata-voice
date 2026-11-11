let key = ""; // module memory only: never localStorage, never in the bundle
export const setKey = (k: string) => { key = k; };

export class ApiError extends Error {
  constructor(public code: string, message: string, public requestId?: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; idem?: string } = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "x-demo-key": key,
        ...(opts.idem ? { "Idempotency-Key": opts.idem } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError("NETWORK", "No connection. Check your internet and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(
      data?.error?.code ?? "UNKNOWN",
      data?.error?.message ?? "Something went wrong. Try again.",
      data?.error?.requestId
    );
  return data as T;
}