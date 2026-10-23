import { useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/order-lookup";
import { formatPrice } from "@/lib/format";
import type { AdminOrderRow } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Track your order — Nova Store" },
    { name: "description", content: "Look up a Nova Store order with your order number and email." },
  ];
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  shipped: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<AdminOrderRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const data = (await res.json()) as { order?: AdminOrderRow; error?: string };
      if (!res.ok || !data.order) {
        setError(data.error ?? "Could not find that order.");
        return;
      }
      setOrder(data.order);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Order tracking
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Track your order
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the order number from your confirmation and the email you used at checkout.
          No account needed.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Order number
          </span>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
            placeholder="NOVA-ABC123456"
            required
            autoComplete="off"
            className={`${inputClass} font-mono uppercase`}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Email
          </span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="alex@example.com"
            required
            autoComplete="email"
            className={inputClass}
          />
        </label>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl disabled:cursor-wait disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Find my order"}
        </button>
      </form>

      {order && (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <div>
              <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {order.order_number}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Placed {new Date(order.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"
              }`}
            >
              {order.status}
            </span>
          </div>

          {order.items_summary && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{order.items_summary}</p>
          )}

          <dl className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
              <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPrice(order.subtotal_cents / 100)}
              </dd>
            </div>
            {(order.discount_cents ?? 0) > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
                </dt>
                <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  −{formatPrice((order.discount_cents ?? 0) / 100)}
                </dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Shipping</dt>
              <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {order.shipping_cents === 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                ) : (
                  formatPrice(order.shipping_cents / 100)
                )}
              </dd>
            </div>
            {order.tax_cents > 0 && (
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Tax (8%)</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatPrice(order.tax_cents / 100)}
                </dd>
              </div>
            )}
            <div className="my-0.5 border-t border-zinc-200 dark:border-zinc-800" />
            <div className="flex items-center justify-between">
              <dt className="font-semibold text-zinc-900 dark:text-zinc-50">Total</dt>
              <dd className="text-lg font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPrice(order.total_cents / 100)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
            Shipping to {order.full_name}, {order.address}, {order.city} {order.zip}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          to="/my-orders"
          className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Have an account? View all my orders
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
