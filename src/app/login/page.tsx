"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Incorrect password. Try again.");
        setSubmitting(false);
        return;
      }
      const from = params.get("from") || "/";
      router.replace(from);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm"
    >
      <div className="mb-5">
        <div className="mb-2 grid h-11 w-11 place-items-center rounded-xl bg-[#2383e2] text-lg font-semibold text-white">
          B
        </div>
        <h1 className="text-xl font-semibold text-ink">Backlog</h1>
        <p className="mt-1 text-sm text-subtle">Enter the password to continue.</p>
      </div>

      <input
        autoFocus
        type="password"
        aria-label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full rounded-lg border border-line px-3 py-2 text-sm text-ink outline-none focus:border-[#2383e2]"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !password}
        className="mt-4 w-full rounded-lg bg-[#2383e2] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Unlocking…" : "Unlock"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-hover/40 px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
