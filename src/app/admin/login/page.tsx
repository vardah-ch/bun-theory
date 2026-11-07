import type { Metadata } from "next";
import { Logo } from "@/components/brand/Logo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return (
    <main className="relative z-20 flex min-h-dvh items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm">
        <div className="text-4xl text-cream"><Logo /></div>
        <p className="type-annot mt-6 text-fire">Kitchen office</p>
        <h1 className="type-display mt-2 text-6xl text-cream">Staff sign in</h1>
        <LoginForm />
      </div>
    </main>
  );
}
