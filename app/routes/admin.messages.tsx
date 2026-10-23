import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.messages";
import type { ContactMessage } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Messages — Admin — Nova Store" }];
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "read">("all");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/messages")
      .then((r) => r.json())
      .then((d: { messages?: ContactMessage[] }) => setMessages(d.messages ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id: number, status: "new" | "read") {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
      }
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this message?")) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, { method: "DELETE" });
      if (res.ok) setMessages((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setBusy(null);
    }
  }

  const filtered = messages.filter((message) => {
    const matchFilter = filter === "all" || message.status === filter;
    const needle = search.trim().toLowerCase();
    const matchSearch = !needle ||
      [message.name, message.email, message.subject, message.message]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return matchFilter && matchSearch;
  });

  const unread = messages.filter((m) => m.status === "new").length;

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Messages</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {messages.length} total · {unread} unread
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-zinc-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-64"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | "new" | "read")}
          className="h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="all">All messages</option>
          <option value="new">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No messages found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((message) => (
            <article
              key={message.id}
              className={`rounded-2xl border bg-white p-5 dark:bg-zinc-900 ${
                message.status === "new"
                  ? "border-violet-300 dark:border-violet-800"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">{message.subject}</h2>
                    {message.status === "new" && (
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {message.name} · {message.email} ·{" "}
                    {new Date(message.created_at).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    disabled={busy === message.id}
                    onClick={() => setStatus(message.id, message.status === "new" ? "read" : "new")}
                    className="text-violet-600 hover:text-violet-700 disabled:opacity-50 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    {message.status === "new" ? "Mark read" : "Mark unread"}
                  </button>
                  <button
                    type="button"
                    disabled={busy === message.id}
                    onClick={() => remove(message.id)}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {message.message}
              </p>
              <a
                href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject}`)}`}
                className="mt-3 inline-block text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Reply by email →
              </a>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
