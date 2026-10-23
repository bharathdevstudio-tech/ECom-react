import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.subscribers";
import type { NewsletterSubscriber } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Newsletter subscribers — Admin — Nova Store" }];
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/subscribers")
      .then((r) => r.json())
      .then((d) => {
        const data = d as { subscribers?: NewsletterSubscriber[] };
        setSubscribers(data.subscribers ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function remove(item: NewsletterSubscriber) {
    if (!window.confirm(`Remove ${item.email} from the newsletter?`)) return;
    setError(null);
    setBusy(item.id);
    try {
      const res = await fetch(`/api/admin/subscribers?id=${item.id}`, { method: "DELETE" });
      if (res.ok) {
        setSubscribers((prev) => prev.filter((row) => row.id !== item.id));
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not remove the subscriber.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  function exportCsv() {
    const rows = [
      ["Email", "Subscribed at"],
      ...subscribers.map((item) => [item.email, item.created_at]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nova-newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const needle = search.trim().toLowerCase();
  const filtered = subscribers.filter(
    (item) => !needle || item.email.toLowerCase().includes(needle),
  );

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Subscribers</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {subscribers.length} newsletter {subscribers.length === 1 ? "subscriber" : "subscribers"}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={subscribers.length === 0}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-full border border-zinc-300 bg-white px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-72"
        />
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          {subscribers.length === 0
            ? "No newsletter subscribers yet. The signup form is in the site footer."
            : "No subscribers match your search."}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filtered.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.email}</p>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Subscribed {item.created_at.slice(0, 10)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy === item.id}
                  onClick={() => remove(item)}
                  className="text-xs font-semibold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                >
                  {busy === item.id ? "Removing…" : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
