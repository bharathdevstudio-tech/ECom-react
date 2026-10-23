import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/admin.questions";
import type { ProductQuestion } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Product Q&A — Admin — Nova Store" }];
}

type Filter = "all" | "unanswered" | "answered";

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("unanswered");
  const [search, setSearch] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    fetch("/api/admin/questions")
      .then((r) => r.json())
      .then((d) => {
        const data = d as { questions?: ProductQuestion[] };
        const list = data.questions ?? [];
        setQuestions(list);
        setAnswers(Object.fromEntries(list.map((q) => [q.id, q.answer ?? ""])));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function saveAnswer(item: ProductQuestion) {
    const answer = (answers[item.id] ?? "").trim();
    if (answer.length < 3) {
      setError("Write an answer of at least 3 characters.");
      return;
    }
    setError(null);
    setBusy(item.id);
    try {
      const res = await fetch("/api/admin/questions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, answer }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not save the answer.");
        return;
      }
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, answer, answered_at: q.answered_at ?? new Date().toISOString().slice(0, 19).replace("T", " ") }
            : q,
        ),
      );
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this question permanently?")) return;
    setError(null);
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Could not delete the question.");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const filtered = questions.filter((item) => {
    const matchFilter =
      filter === "all" ||
      (filter === "unanswered" && !item.answer) ||
      (filter === "answered" && !!item.answer);
    const needle = search.trim().toLowerCase();
    const matchSearch =
      !needle ||
      [item.product_name ?? "", item.product_id, item.author, item.question, item.answer ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return matchFilter && matchSearch;
  });

  const unanswered = questions.filter((q) => !q.answer).length;

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Product Q&amp;A</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {questions.length} total · {unanswered} unanswered — only answered questions appear on the storefront.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search product, customer, question…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-full border border-zinc-300 bg-white px-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-72"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
          className="h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="unanswered">Unanswered</option>
          <option value="answered">Answered</option>
          <option value="all">All questions</option>
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
          No questions found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link
                    to={`/products/${item.product_id}`}
                    className="text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    {item.product_name ?? item.product_id}
                  </Link>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {item.author} · {item.created_at.slice(0, 10)}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      item.answer
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                    }`}
                  >
                    {item.answer ? "Answered" : "Unanswered"}
                  </span>
                  <button
                    type="button"
                    disabled={busy === item.id}
                    onClick={() => remove(item.id)}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <p className="mt-3 text-sm font-medium text-zinc-800 dark:text-zinc-100">{item.question}</p>

              <label className="mt-3 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Answer
                <textarea
                  value={answers[item.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  rows={3}
                  maxLength={2000}
                  placeholder="Write a helpful, accurate answer…"
                  className="mt-1 w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                />
              </label>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => saveAnswer(item)}
                className="mt-2 rounded-full bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-wait disabled:opacity-60"
              >
                {busy === item.id ? "Saving…" : item.answer ? "Update answer" : "Publish answer"}
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
