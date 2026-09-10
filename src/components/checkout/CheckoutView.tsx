import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useCart } from "@/components/cart/CartContext";
import { createBrowserStore } from "@/lib/clientStore";
import { formatPrice } from "@/lib/format";
import type { OrderConfirmation, OrderInput } from "@/lib/types";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING, TAX_RATE } from "@/lib/constants";

const confirmationStore = createBrowserStore<OrderConfirmation | null>(
  "__nova_confirmation_store__",
  null,
);

function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder: string;
  autoComplete: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={inputMode}
        className="h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
      />
    </label>
  );
}

function SubmitButton({ placing, total, hidden }: { placing: boolean; total: number; hidden?: "mobile" | "desktop" }) {
  const cls = hidden === "desktop"
    ? "md:hidden"
    : hidden === "mobile"
      ? "hidden md:inline-flex"
      : "inline-flex";

  return (
    <button
      type="submit"
      disabled={placing}
      className={`${cls} h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all ${
        placing
          ? "cursor-wait bg-zinc-300 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
          : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/20 hover:shadow-xl hover:shadow-violet-600/30 active:scale-[0.99]"
      }`}
    >
      {placing ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800 dark:border-zinc-500 dark:border-t-zinc-100" />
          Placing order…
        </>
      ) : (
        <>Place order · {formatPrice(total)} →</>
      )}
    </button>
  );
}

export default function CheckoutView() {
  const navigate = useNavigate();
  const { items, count, subtotal, clearCart } = useCart();
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Preview totals (client-side, matches server logic)
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : FLAT_SHIPPING;
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + shipping + tax).toFixed(2));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (placing || items.length === 0) return;
    setOrderError(null);

    const form = new FormData(e.currentTarget);
    const input: OrderInput = {
      fullName: String(form.get("fullName") ?? "").trim(),
      email:    String(form.get("email")    ?? "").trim(),
      address:  String(form.get("address")  ?? "").trim(),
      city:     String(form.get("city")     ?? "").trim(),
      zip:      String(form.get("zip")      ?? "").trim(),
    };

    // Client-side guard (browser native validation already runs, this is a fallback)
    if (Object.values(input).some((v) => v === "")) {
      setOrderError("Please fill in all shipping fields.");
      return;
    }

    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Only send input + items; server recomputes all prices, tax, shipping
        body: JSON.stringify({ input, items }),
      });

      const data = (await res.json()) as OrderConfirmation & { error?: string };

      if (!res.ok) {
        setOrderError(data.error ?? "Order failed. Please try again.");
        return;
      }

      confirmationStore.replace(data);
      clearCart();
      navigate("/order-confirmation");
    } catch {
      setOrderError("Network error. Check your connection and try again.");
    } finally {
      setPlacing(false);
    }
  }

  // ── Empty cart guard ──────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-5xl dark:bg-zinc-900">
          📝
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nothing to check out yet
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Add a few products to your cart before checking out.
          </p>
        </div>
        <Link
          to="/products"
          className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-105 active:scale-95"
        >
          Go shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Almost there
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Checkout
        </h1>
      </div>

      {/* Global order error banner */}
      {orderError && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
          <span className="mt-0.5 shrink-0 text-base" aria-hidden="true">⚠️</span>
          <div>
            <p className="font-semibold">Order failed</p>
            <p className="mt-0.5">{orderError}</p>
          </div>
          <button
            type="button"
            onClick={() => setOrderError(null)}
            className="ml-auto shrink-0 rounded-full p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
        {/* ── Left: shipping form ────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <h2 className="mb-5 font-bold text-zinc-900 dark:text-zinc-50">Shipping details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Full name" name="fullName" placeholder="Alex Rivera" autoComplete="name" />
              </div>
              <div className="sm:col-span-2">
                <Field label="Email" name="email" type="email" placeholder="alex@example.com" autoComplete="email" />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Street address"
                  name="address"
                  placeholder="100 Market Street"
                  autoComplete="street-address"
                />
              </div>
              <Field label="City" name="city" placeholder="San Francisco" autoComplete="address-level2" />
              <Field
                label="ZIP / Postal code"
                name="zip"
                placeholder="94103"
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </div>
          </section>

          {/* Mobile submit (shown above summary) */}
          <SubmitButton placing={placing} total={total} hidden="desktop" />
        </div>

        {/* ── Right: order summary sticky on md+ ────────────────────────── */}
        <aside className="md:sticky md:top-24 md:self-start">
          <section className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Order summary</h2>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {count} item{count === 1 ? "" : "s"}
              </span>
            </div>

            {/* Item list */}
            <ul className="flex flex-col gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              {items.map(({ product, quantity }) => (
                <li key={product.id} className="flex items-center gap-3 text-sm">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.gradient} text-xl`}
                      >
                        {product.emoji}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {product.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">×{quantity}</p>
                  </div>
                  <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {formatPrice(product.price * quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {/* Totals */}
            <dl className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatPrice(subtotal)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Shipping</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {shipping === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-zinc-500 dark:text-zinc-400">Tax (8%)</dt>
                <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatPrice(tax)}
                </dd>
              </div>
              <div className="my-0.5 border-t border-zinc-200 dark:border-zinc-800" />
              <div className="flex items-center justify-between">
                <dt className="font-semibold text-zinc-900 dark:text-zinc-50">Total</dt>
                <dd className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatPrice(total)}
                </dd>
              </div>
            </dl>

            {/* Desktop submit */}
            <SubmitButton placing={placing} total={total} hidden="mobile" />

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="text-center text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              ← Back to cart
            </button>
          </section>
        </aside>
      </form>
    </div>
  );
}
