import "server-only";
import { db } from "./db";

export async function addSubscriber(email: string): Promise<{ already: boolean }> {
  const existing = await db.subscriber.findUnique({ where: { email } });
  if (existing) return { already: true };
  await db.subscriber.create({ data: { email } });
  return { already: false };
}
