import { useSyncExternalStore } from "react";
import { Link } from "react-router";
import { createBrowserStore } from "@/lib/clientStore";
import { formatPrice } from "@/lib/format";
import type { OrderConfirmation } from "@/lib/types";

const confirmationStore = createBrowserStore<OrderConfirmation | null>(
  "__nova_confirmation_store__",
  null,
);

export default function OrderConfirmationView() {
  const confirmation = useSyncExternalStore(
    confirmationStore.subscribe,
    confirmationStore.getSnapshot,
    confirmationStore.getServerSnapshot,
  );

  if (!confirmation) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-5xl dark:bg-zinc-900">
          🧾
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Can&apos;t find an order here
          </h1>
          <p className="mt-2 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Confirmations are stored locally for this session. Place an order
            from your cart to see it here.
          </p>
        </div>
        <Link
          to="/products"
          className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-105 active:scale-95"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // tax may be missing on old confirmations stored before the fix — default 0
  const tax = confirmation.tax ?? 0;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6 sm:py-16">

      {/* ── Success header ─────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-4xl dark:bg-emerald-950">
          🎉
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Order confirmed
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            Thanks, {confirmation.fullName.split(" ")[0]}!
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            We&apos;ve emailed a receipt to{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {confirmation.email}
            </span>
            .
          </p>
        </div>
      </div>

      {/* ── Order card ─────────────────────────────────────────────────── */}
      <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">

        {/* Order number + item count */}
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Order number</p>
            <p className="mt-0.5 font-mono text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
              {confirmation.orderNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-400 dark:text-zinc-500">Items ordered</p>
            <p className="mt-0.5 text-xl font-extrabold text-zinc-900 dark:text-zinc-50">
              {confirmation.itemCount}
            </p>
          </div>
        </div>

        {/* Price breakdown — now including tax, matching checkout display */}
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
            <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatPrice(confirmation.subtotal)}
            </dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-zinc-500 dark:text-zinc-400">Shipping</dt>
            <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {confirmation.shipping === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400">Free</span>
              ) : (
                formatPrice(confirmation.shipping)
              )}
            </dd>
          </div>

          {tax > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-zinc-500 dark:text-zinc-400">Tax (8%)</dt>
              <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPrice(tax)}
              </dd>
            </div>
          )}

          <div className="my-0.5 border-t border-zinc-200 dark:border-zinc-800" />

          <div className="flex items-center justify-between">
            <dt className="font-semibold text-zinc-900 dark:text-zinc-50">Total</dt>
            <dd className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
              {formatPrice(confirmation.total)}
            </dd>
          </div>
        </dl>

        {/* Delivery info */}
        <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          🚚 Your order is being prepared and will ship within 24 hours.
          Estimated delivery is 2–4 business days.
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <Link
          to="/products"
          className="inline-flex h-12 w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Continue shopping
        </Link>
        <Link
          to="/my-orders"
          className="inline-flex h-11 w-full items-center justify-center rounded-full border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
        >
          View all my orders
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
