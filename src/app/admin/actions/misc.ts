"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import type { ActionResult } from "@/components/admin/ActionForm";

export async function markNotificationsRead(): Promise<ActionResult> {
  await requireStaff();
  await db.notification.updateMany({ where: { read: false }, data: { read: true } });
  revalidatePath("/admin", "layout");
  return { ok: true, message: "Done" };
}
