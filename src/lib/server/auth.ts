import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_HOURS, signSession, verifySession, type Role, type Session } from "./session";

const RANK: Record<Role, number> = { STAFF: 1, MANAGER: 2, OWNER: 3 };

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const session = await verifySession(store.get(SESSION_COOKIE)?.value);
  if (!session) return null;
  // Disabled or deleted accounts lose access immediately, not when the cookie expires.
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { active: true, role: true, name: true } });
  if (!user?.active) return null;
  return { ...session, role: user.role, name: user.name };
}

/** Use at the top of every admin page and server action. */
export async function requireStaff(min: Role = "STAFF"): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  if (RANK[s.role] < RANK[min]) throw new Error("You don't have permission to do that.");
  return s;
}

export async function startSession(s: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// Simple in-memory brute-force brake: 5 failures per email+IP per 15 minutes.
// For multi-instance hosting, move this to Redis or the database.
const attempts = new Map<string, { n: number; until: number }>();
export function loginBlocked(key: string) {
  const a = attempts.get(key);
  return Boolean(a && a.n >= 5 && a.until > Date.now());
}
export function recordFailure(key: string) {
  const a = attempts.get(key);
  const fresh = !a || a.until < Date.now();
  attempts.set(key, { n: fresh ? 1 : a.n + 1, until: Date.now() + 15 * 60 * 1000 });
}
export function clearFailures(key: string) {
  attempts.delete(key);
}
