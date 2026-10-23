import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.returns";
import type { ReturnRequest, ReturnStatus } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Returns — Admin — Nova Store" }];
}

const STATUS_STYLES: Record<ReturnStatus, string> = {
  requested: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

type Filter = "all" | ReturnStatus;

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/returns")
      .then((r) => r.json())
      .then((d) => {
        const data = d as { returns?: ReturnRequest[] };
        setReturns(data.returns ?? []);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(item: ReturnRequest, status: ReturnStatus) {
    if (busy !== null) return;
    if (status === "completed") {
      const ok = window.confirm(
        `Mark return for ${item.order_number} as received? The items will be added back to stock.`,
      );
      if (!ok) return;
    }
    setError(null);
    setBusy(item.id);
    try {
      const res = await fetch("/api/admin/returns", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, status, note: notes[item.id] ?? "" }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        returnRequest?: ReturnRequest;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.returnRequest) {
        setError(data.error ?? "Could not update the return.");
        return;
      }
      setReturns((prev) =>
        prev.map((row) => (row.id === item.id ? data.returnRequest! : row)),
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = returns.filter((item) => {
    const matchFilter = filter === "all" || item.status === filter;
    const needle = search.trim().toLowerCase();
    const matchSearch =
      !needle ||
      [item.order_number, item.customer_name ?? "", item.customer_email ?? "", item.reason, item.details]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return matchFilter && matchSearch;
  });

  const pending = returns.filter((r) => r.status === "requested").length;
  const approved = returns.filter((r) => r.status === "approved").length;

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Returns</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {returns.length} total · {pending} awaiting review · {approved} awaiting receipt
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search order, customer, reason…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-full border border-zinc-300 bg-white px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-72"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="all">All returns</option>
          <option value="requested">Awaiting review</option>
          <option value="approved">Awaiting receipt</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
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
          No return requests found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => {
            const active = item.status === "requested" || item.status === "approved";
            return (
              <article
                key={item.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {item.order_number}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_STYLES[item.status]}`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {item.customer_name} · {item.customer_email} · requested {item.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{item.reason}</p>
                </div>

                {item.details && (
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:bg-zinc-950/50 dark:text-zinc-300">
                    {item.details}
                  </p>
                )}

                {item.admin_note && (
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold">Note:</span> {item.admin_note}
                  </p>
                )}

                {active && (
                  <div className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800 sm:flex-row sm:items-end">
                    <label className="flex-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                      Internal note (optional)
                      <input
                        type="text"
                        maxLength={500}
                        value={notes[item.id] ?? item.admin_note ?? ""}
                        onChange={(e) =>
                          setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        placeholder="Add a note for your team"
                        className="mt-1 h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {item.status === "requested" && (
                        <>
                          <button
                            type="button"
                            disabled={busy === item.id}
                            onClick={() => updateStatus(item, "approved")}
                            className="rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                          >
                            {busy === item.id ? "Saving…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={busy === item.id}
                            onClick={() => updateStatus(item, "rejected")}
                            className="rounded-full border border-red-200 px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {item.status === "approved" && (
                        <button
                          type="button"
                          disabled={busy === item.id}
                          onClick={() => updateStatus(item, "completed")}
                          className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                        >
                          {busy === item.id ? "Saving…" : "Mark received & restock"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
