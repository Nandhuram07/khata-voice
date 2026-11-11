import "server-only";
import { createHash, timingSafeEqual, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { env } from "./env";

/* ---------- errors ---------- */
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    public publicMessage: string
  ) {
    super(code);
  }
}

/* ---------- logging: structured, never logs names/emails/utterances ---------- */
export function log(level: "info" | "warn" | "error", msg: string, meta: Record<string, unknown> = {}) {
  console[level === "info" ? "log" : level](JSON.stringify({ t: new Date().toISOString(), level, msg, ...meta }));
}

/* ---------- auth: shared demo key, constant-time compare ---------- */
const digest = (s: string) => createHash("sha256").update(s).digest();
export function requireAuth(req: Request) {
  const given = req.headers.get("x-demo-key") ?? "";
  if (!timingSafeEqual(digest(given), digest(env.DEMO_ACCESS_KEY)))
    throw new AppError(401, "UNAUTHORIZED", "Invalid access key.");
}

/* ---------- CSRF-style protection: state-changing calls must come from our own origin ---------- */
export function requireSameOrigin(req: Request) {
  if (req.method === "GET") return;
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host)
    throw new AppError(403, "BAD_ORIGIN", "Request origin not allowed.");
}

/* ---------- rate limiting: sliding window, in-memory ---------- */
// NOTE: per-instance. In multi-instance production, swap for Redis (e.g. Upstash).
const hits = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    throw new AppError(429, "RATE_LIMITED", "Too many requests. Please wait a moment.");
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
}

/* ---------- idempotency: a double-tap must never create two invoices ---------- */
const idem = new Map<string, { at: number; p: Promise<unknown> }>();
export async function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  for (const [k, v] of idem) if (now - v.at > 10 * 60_000) idem.delete(k);
  const existing = idem.get(key);
  if (existing) return existing.p as Promise<T>;
  const p = fn().catch((e) => {
    idem.delete(key); // allow retry after failure
    throw e;
  });
  idem.set(key, { at: now, p });
  return p;
}

/* ---------- body reader with size cap ---------- */
export async function readJson(req: Request, maxBytes = 10_000) {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > maxBytes) throw new AppError(413, "TOO_LARGE", "Request too large.");
  const text = await req.text();
  if (text.length > maxBytes) throw new AppError(413, "TOO_LARGE", "Request too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(400, "BAD_JSON", "Invalid JSON.");
  }
}

/* ---------- guard: wraps every route with the same protections ---------- */
type Opts = { name: string; limit: number };
export function guard(opts: Opts, handler: (req: Request, ctx: { requestId: string }) => Promise<unknown>) {
  return async (req: Request) => {
    const requestId = randomUUID();
    const started = Date.now();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
    try {
      rateLimit(`${opts.name}:${ip}`, opts.limit);
      requireSameOrigin(req);
      requireAuth(req);
      const data = await handler(req, { requestId });
      log("info", "request_ok", { route: opts.name, requestId, ms: Date.now() - started });
      return NextResponse.json(data, { headers: { "x-request-id": requestId } });
    } catch (e) {
      if (e instanceof AppError) {
        log("warn", "request_rejected", { route: opts.name, requestId, code: e.code });
        return NextResponse.json({ error: { code: e.code, message: e.publicMessage, requestId } }, { status: e.status });
      }
      if (e instanceof ZodError) {
        log("warn", "validation_failed", { route: opts.name, requestId });
        return NextResponse.json(
          { error: { code: "INVALID_INPUT", message: "Some details look wrong. Please check and retry.", requestId } },
          { status: 400 }
        );
      }
      log("error", "unhandled", { route: opts.name, requestId, err: e instanceof Error ? e.message : "unknown" });
      return NextResponse.json(
        { error: { code: "INTERNAL", message: "Something went wrong.", requestId } },
        { status: 500 }
      );
    }
  };
}