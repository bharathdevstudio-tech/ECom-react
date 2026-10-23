import { data, Link, redirect } from "react-router";
import type { Route } from "./+types/my-orders.$id.invoice";
import { formatPrice } from "@/lib/format";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Invoice — Nova Store" },
    { name: "robots", content: "noindex" },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) throw data(null, { status: 404 });

  if (!user) {
    return redirect(`/login?redirect=${encodeURIComponent(`/my-orders/${id}/invoice`)}`);
  }

  const order = await db.getOrderWithItemsForUser(user.id, id);
  if (!order) throw data(null, { status: 404 });

  return { order };
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  card: "Credit / debit card",
  upi: "UPI",
};

export default function InvoicePage({ loaderData }: Route.ComponentProps) {
  const { order } = loaderData;
  const discount = order.discount_cents ?? 0;
  const payment = order.payment_method
    ? (PAYMENT_LABELS[order.payment_method] ?? order.payment_method)
    : "—";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10 print:max-w-none print:p-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to="/my-orders"
          className="text-sm font-semibold text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          ← Back to my orders
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-105"
        >
          Print / save as PDF
        </button>
      </div>

      <article className="invoice-sheet overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white">
              N
            </span>
            <div>
              <p className="text-lg font-bold tracking-tight">Nova Store</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Premium tech, thoughtfully curated</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Invoice
            </p>
            <p className="mt-1 font-mono text-sm font-bold">{order.order_number}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{order.created_at.slice(0, 10)}</p>
          </div>
        </header>

        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Billed to
            </h2>
            <p className="mt-2 text-sm font-semibold">{order.full_name}</p>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">{order.email}</p>
            {order.phone && (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{order.phone}</p>
            )}
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {order.address}
              <br />
              {order.city}
              {order.state ? `, ${order.state}` : ""} {order.zip}
            </p>
          </div>
          <div className="sm:text-right">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Payment &amp; status
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{payment}</p>
            <p className="mt-1 inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {order.status}
            </p>
            {order.coupon_code && (
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Coupon: {order.coupon_code}</p>
            )}
          </div>
        </section>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
                <th className="pb-2 font-semibold">Item</th>
                <th className="pb-2 text-right font-semibold">Qty</th>
                <th className="pb-2 text-right font-semibold">Unit price</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800/60">
                  <td className="py-3 pr-3 font-medium">{item.product_name}</td>
                  <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums">{formatPrice(item.price_cents / 100)}</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatPrice((item.price_cents * item.quantity) / 100)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="mt-6 ml-auto max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotal_cents / 100)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
              <span>Discount</span>
              <span className="tabular-nums">−{formatPrice(discount / 100)}</span>
            </div>
          )}
          <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
            <span>Shipping</span>
            <span className="tabular-nums">{formatPrice(order.shipping_cents / 100)}</span>
          </div>
          <div className="flex justify-between text-zinc-600 dark:text-zinc-300">
            <span>Tax</span>
            <span className="tabular-nums">{formatPrice(order.tax_cents / 100)}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold dark:border-zinc-800">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.total_cents / 100)}</span>
          </div>
        </section>

        <footer className="mt-8 border-t border-zinc-200 pt-5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>Thank you for shopping with Nova Store.</p>
          <p className="mt-1">
            Questions about this invoice? Contact support@novastore.example and reference {order.order_number}.
          </p>
        </footer>
      </article>
    </div>
  );
}
