import "server-only";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchJson(
  url: string,
  init: RequestInit = {},
  { timeoutMs = 8000, retries = 0 }: { timeoutMs?: number; retries?: number } = {}
) {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
      if ((res.status === 429 || res.status >= 500) && i < retries) {
        await sleep(2 ** i * 300 + Math.random() * 200); // exponential backoff + jitter
        continue;
      }
      const raw = await res.text();
      /* eslint-disable @typescript-eslint/no-explicit-any */
      let body: any = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = { raw: raw.slice(0, 200) }; }
      return { ok: res.ok, status: res.status, body };
    } catch (e) {
      if (i < retries) { await sleep(2 ** i * 300); continue; }
      throw e;
    }
  }
}
