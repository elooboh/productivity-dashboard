"use client";

import { useState } from "react";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        const params = new URLSearchParams(window.location.search);
        const next = params.get("next");
        window.location.href =
          next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
        return;
      }
      setError("Incorrect passcode. Try again.");
    } catch {
      setError("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-line bg-white/55 p-8 text-center shadow-soft backdrop-blur-md"
      >
        <span className="text-2xl text-terracotta">✦</span>
        <h1 className="mt-3 font-serif text-2xl font-semibold text-ink">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Enter your passcode to open your dashboard.
        </p>

        <input
          type="password"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          placeholder="Passcode"
          autoFocus
          className="mt-6 w-full rounded-lg border border-line bg-cream/50 px-3 py-2.5 text-center text-sm text-ink outline-none transition focus:border-terracotta focus:bg-white/70"
        />

        {error && (
          <p className="mt-2 text-xs text-terracotta-deep">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !passcode}
          className="mt-4 w-full rounded-lg bg-terracotta py-2.5 text-sm font-medium text-white shadow-soft transition hover:bg-terracotta-deep disabled:opacity-50"
        >
          {loading ? "Unlocking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
