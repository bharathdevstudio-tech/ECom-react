import { useState } from "react";

type Status = "idle" | "sending" | "ok" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function subscribe(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; created?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not subscribe. Try again.");
        return;
      }
      setStatus("ok");
      setMessage(
        data.created
          ? "You're in! Watch your inbox for new drops and offers."
          : "You're already subscribed — thanks for sticking with us.",
      );
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className="mb-10 rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 dark:border-violet-900/50 dark:from-violet-950/30 dark:to-zinc-950 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-50">Join the Nova newsletter</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            New drops, buying guides and subscriber-only offers. No spam, unsubscribe anytime.
          </p>
        </div>
        <form onSubmit={subscribe} className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">
            Email address
          </label>
          <input
            id="newsletter-email"
            type="email"
            name="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-11 min-w-0 flex-1 rounded-full border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="h-11 shrink-0 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
          >
            {status === "sending" ? "Joining…" : "Subscribe"}
          </button>
        </form>
      </div>
      {message && (
        <p
          aria-live="polite"
          className={`mt-3 text-sm font-medium ${
            status === "ok"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
