"use client";

import { useActionState } from "react";
import { Check, Loader2 } from "lucide-react";

export type ActionResult = { ok?: boolean; error?: string; message?: string };
type Action = (prev: ActionResult, form: FormData) => Promise<ActionResult>;

/**
 * Form bound to a server action, with pending, saved and error states.
 * Every admin edit goes through this so feedback is consistent.
 */
export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  className = "",
  inline = false,
  danger = false,
  confirm,
}: {
  action: Action;
  children?: React.ReactNode;
  submitLabel?: string;
  className?: string;
  inline?: boolean;
  danger?: boolean;
  confirm?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(action, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={inline ? `flex flex-wrap items-center gap-2 ${className}` : `space-y-4 ${className}`}
    >
      {children}
      <div className="flex items-center gap-3">
        <button
          disabled={pending}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-60 ${danger ? "border border-fire/50 text-fire hover:bg-fire hover:text-ink" : "bg-fire text-ink hover:bg-cream"}`}
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
          {submitLabel}
        </button>
        <span role="status" className="text-sm">
          {state.error ? (
            <span className="text-fire">{state.error}</span>
          ) : state.ok && !pending ? (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> {state.message ?? "Saved"}
            </span>
          ) : null}
        </span>
      </div>
    </form>
  );
}
