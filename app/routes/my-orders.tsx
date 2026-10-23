import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/my-orders";
import { useAuth } from "@/components/auth/AuthContext";
import { formatPrice } from "@/lib/format";
import type { AdminOrderRow } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "My Orders — Nova Store" }];
}

const STATUS_STYLES: Record<string, string> = {
  confirmed:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  shipped:    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  delivered:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled:  "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"] as const;
const STEP_LABELS: Record<(typeof STATUS_STEPS)[number], string> = {
  confirmed: "Order placed",
  processing: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-300">
        <span aria-hidden="true">✕</span>
        This order was cancelled and the items were returned to stock.
      </div>
    );
  }

  const current = Math.max(0, STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]));
  return (
    <ol className="mt-4 flex items-center gap-1" aria-label={`Order status: ${status}`}>
      {STATUS_STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step} className="flex min-w-0 flex-1 items-center gap-1">
            <div className="flex min-w-0 flex-col items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-violet-600 text-white"
                    : "border border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={`mt-1 truncate text-[10px] font-medium ${
                  done ? "text-violet-700 dark:text-violet-300" : "text-zinc-400 dark:text-zinc-500"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {index < STATUS_STEPS.length - 1 && (
              <span
                className={`mb-4 h-0.5 flex-1 rounded-full ${
                  index < current ? "bg-violet-600" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ orderId: number; type: "ok" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login?redirect=/my-orders", { replace: true }); return; }
    fetch("/api/my-orders")
      .then((r) => r.json())
      .then((d: { orders: AdminOrderRow[] }) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  async function cancelOrder(order: AdminOrderRow) {
    if (cancelling !== null) return;
    const confirmed = window.confirm(
      `Cancel order ${order.order_number}? The items will be returned to stock.`,
    );
    if (!confirmed) return;

    setNotice(null);
    setCancelling(order.id);
    try {
      const res = await fetch(`/api/my-orders/${order.id}/cancel`, { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; order?: AdminOrderRow; error?: string };
      if (!res.ok || !data.ok || !data.order) {
        setNotice({ orderId: order.id, type: "error", message: data.error ?? "Could not cancel this order." });
        return;
      }
      setOrders((prev) => prev.map((row) => (row.id === order.id ? data.order! : row)));
      setNotice({ orderId: order.id, type: "ok", message: "Order cancelled. A refund will reach you in 3–5 business days." });
    } catch {
      setNotice({ orderId: order.id, type: "error", message: "Network error. Try again." });
    } finally {
      setCancelling(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Account</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          My orders
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Signed in as <span className="font-medium text-zinc-800 dark:text-zinc-200">{user?.email}</span>
        </p>
        <Link
          to="/order-lookup"
          className="mt-2 inline-block text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          Track a guest order →
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 py-20 text-center dark:border-zinc-700">
          <span className="text-5xl" aria-hidden="true">📦</span>
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">No orders yet.</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Place an order to see it here.</p>
          </div>
          <Link to="/products" className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-105">
            Browse products
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const canCancel = order.status === "confirmed" || order.status === "processing";
            return (
              <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-zinc-900 dark:text-zinc-50">{order.order_number}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {order.status}
                  </span>
                </div>
                {order.items_summary && (
                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300 line-clamp-2">{order.items_summary}</p>
                )}

                <OrderTimeline status={order.status} />

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex gap-4 text-sm">
                    <span className="text-zinc-500 dark:text-zinc-400">Subtotal <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatPrice(order.subtotal_cents / 100)}</span></span>
                    <span className="text-zinc-500 dark:text-zinc-400">Total <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatPrice(order.total_cents / 100)}</span></span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{order.city}, {order.zip}</p>
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => cancelOrder(order)}
                        disabled={cancelling !== null}
                        className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-wait disabled:opacity-60 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        {cancelling === order.id ? "Cancelling…" : "Cancel order"}
                      </button>
                    )}
                  </div>
                </div>

                {notice?.orderId === order.id && (
                  <p
                    className={`mt-3 rounded-xl px-3 py-2 text-xs font-medium ${
                      notice.type === "ok"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                    }`}
                  >
                    {notice.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
