"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "done"; message: string } | { kind: "error"; message: string };

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; already?: boolean };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong. Try again in a minute.");
      setState({ kind: "done", message: data.already ? "You're already on the list." : "You're on the list." });
      setEmail("");
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  };

  return (
    <form onSubmit={submit} className="mt-5 max-w-md" noValidate>
      <label htmlFor="nl-email" className="sr-only">Email address</label>
      <div className="flex items-center border-b border-cream/30 focus-within:border-fire">
        <input
          id="nl-email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent py-3 text-lg text-cream placeholder:text-cream/30 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state.kind === "sending"}
          aria-label="Subscribe"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fire text-ink disabled:opacity-60"
        >
          {state.kind === "sending" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      <p role="status" className={`type-annot mt-3 min-h-4 ${state.kind === "error" ? "text-fire" : "text-cream/60"}`}>
        {state.kind === "done" || state.kind === "error" ? state.message : ""}
      </p>
    </form>
  );
}
