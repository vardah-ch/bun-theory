"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { login, type LoginState } from "../actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <label className="block">
        <span className="type-annot text-cream/55">Email</span>
        <input name="email" type="email" required autoComplete="username" defaultValue={state.email} className="admin-input mt-2" />
      </label>
      <label className="block">
        <span className="type-annot text-cream/55">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="admin-input mt-2" />
      </label>
      {state.error && <p role="alert" className="text-sm text-fire">{state.error}</p>}
      <button disabled={pending} className="flex w-full items-center justify-center gap-2 rounded-full bg-fire py-3.5 text-sm font-semibold uppercase tracking-wide text-ink hover:bg-cream disabled:opacity-60">
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Sign in
      </button>
    </form>
  );
}
