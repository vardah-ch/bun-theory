"use client";

import { useActionState } from "react";
import { changePassword, type PasswordState } from "../../actions/auth";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-3">
      <label className="block"><span className="type-annot text-cream/50">Current password</span>
        <input name="current" type="password" autoComplete="current-password" className="admin-input mt-1.5" /></label>
      <label className="block"><span className="type-annot text-cream/50">New password (10+ characters)</span>
        <input name="next" type="password" minLength={10} autoComplete="new-password" className="admin-input mt-1.5" /></label>
      <div className="flex items-center gap-3">
        <button disabled={pending} className="rounded-full bg-fire px-4 py-2 text-sm font-semibold text-ink hover:bg-cream disabled:opacity-60">Change password</button>
        <span role="status" className="text-sm">{state.error ? <span className="text-fire">{state.error}</span> : state.ok ? <span className="text-emerald-300">Password changed</span> : null}</span>
      </div>
    </form>
  );
}
