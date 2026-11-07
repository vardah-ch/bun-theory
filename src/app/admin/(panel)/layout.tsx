import type { Metadata } from "next";
import { Suspense } from "react";
import { requireStaff } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin · BUN THEORY" }, robots: { index: false, follow: false } };

async function Shell({ children }: { children: React.ReactNode }) {
  const session = await requireStaff();
  const unread = await db.notification.count({ where: { read: false } });
  return (
    <div className="relative z-20 min-h-dvh bg-[#0c0a09] text-cream md:grid md:grid-cols-[15rem_1fr]">
      <AdminNav name={session.name} role={session.role} unread={unread} />
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[#0c0a09]" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
