import "server-only";
import { Redis } from "@upstash/redis";

export type OrderRecord = {
  id: string;
  customer: string;
  amount: number;
  due: string;
  note: string;
  pay_link: string;
  created: number;
};

const redis = Redis.fromEnv(); // reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
const INDEX = "khata:orders"; // sorted set: order id scored by created time
const key = (id: string) => `khata:order:${id}`;

export async function saveOrder(r: OrderRecord): Promise<void> {
  const p = redis.pipeline(); // one round trip for both writes
  p.set(key(r.id), r);
  p.zadd(INDEX, { score: r.created, member: r.id });
  await p.exec();
}

export async function allOrders(limit = 20): Promise<OrderRecord[]> {
  const ids = (await redis.zrange(INDEX, 0, limit - 1, { rev: true })).map(String); // newest first
  if (ids.length === 0) return [];
  const rows = await redis.mget<(OrderRecord | null)[]>(...ids.map(key));
  return rows.filter((r): r is OrderRecord => r !== null);
}