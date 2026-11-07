"use server";

import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/server/db";
import { clearFailures, endSession, loginBlocked, recordFailure, requireStaff, startSession } from "@/lib/server/auth";

export type LoginState = { error?: string; email?: string };

const Creds = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });

// A real hash to compare against when the email doesn't exist, so response time doesn't reveal which emails are staff.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  const parsed = Creds.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password } = parsed.data;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const key = `${email}|${ip}`;
  if (loginBlocked(key)) return { error: "Too many attempts. Try again in 15 minutes.", email };

  const user = await db.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok || !user.active) {
    recordFailure(key);
    return { error: "That email and password don't match.", email };
  }
  clearFailures(key);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await startSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

export type PasswordState = { error?: string; ok?: boolean };

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const s = await requireStaff();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (next.length < 10) return { error: "Use at least 10 characters." };
  const user = await db.user.findUniqueOrThrow({ where: { id: s.userId } });
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Your current password is wrong." };
  await db.user.update({ where: { id: s.userId }, data: { passwordHash: await bcrypt.hash(next, 12) } });
  return { ok: true };
}
