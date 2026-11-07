// Session token helpers. Edge-safe (used by proxy.ts too): no database, no Node APIs.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "bt_admin";
export const SESSION_HOURS = 12;

export type Role = "OWNER" | "MANAGER" | "STAFF";
export type Session = { userId: string; email: string; name: string; role: Role };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error("AUTH_SECRET must be set to at least 32 characters.");
  return new TextEncoder().encode(secret);
}

export async function signSession(s: Session) {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .setSubject(s.userId)
    .sign(key());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const { userId, email, name, role } = payload as Partial<Session>;
    if (!userId || !email || !role) return null;
    return { userId, email, name: name ?? email, role };
  } catch {
    return null;
  }
}
