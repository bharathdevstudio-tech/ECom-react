import { Link } from "react-router";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/format";
import { FREE_SHIPPING_THRESHOLD, FLAT_SHIPPING, TAX_RATE } from "@/lib/constants";

export default function CartView() {
  const { items, count, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { showToast } = useToast();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD || items.length === 0 ? 0 : FLAT_SHIPPING;
  const tax = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + shipping + tax).toFixed(2));

  if (items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-24 text-center sm:px-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-5xl dark:bg-zinc-900">
          🛒
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Your cart is empty
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            Looks like you haven&apos;t added anything yet. Explore the catalog and find something you love.
          </p>
        </div>
        <Link
          to="/products"
          className="mt-1 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-8 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-105 active:scale-95"
        >
          Start shopping
        </Link>
      </div>
    );
  }

  const OrderSummary = (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Order summary</h2>

      {/* Free shipping progress */}
      <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/60">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-medium text-zinc-600 dark:text-zinc-300">Free shipping progress</span>
          <span className="font-semibold tabular-nums text-violet-600 dark:text-violet-400">{progress}%</span>
        </div>
        <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {remaining > 0 ? (
            <>You&apos;re <span className="font-semibold text-zinc-900 dark:text-zinc-50">{formatPrice(remaining)}</span> away from free shipping.</>
          ) : (
            <>You&apos;ve unlocked free shipping! 🎉</>
          )}
        </p>
      </div>

      {/* Totals */}
      <dl className="flex flex-col gap-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500 dark:text-zinc-400">Subtotal</dt>
          <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500 dark:text-zinc-400">Shipping</dt>
          <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {shipping === 0 ? <span className="text-emerald-600 dark:text-emerald-400">Free</span> : formatPrice(shipping)}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-zinc-500 dark:text-zinc-400">Tax (8%)</dt>
          <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{formatPrice(tax)}</dd>
        </div>
        <div className="my-1 border-t border-zinc-200 dark:border-zinc-800" />
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-zinc-900 dark:text-zinc-50">Total</dt>
          <dd className="text-xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">{formatPrice(total)}</dd>
        </div>
      </dl>

      <Link
        to="/checkout"
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Proceed to checkout
        <span aria-hidden="true">→</span>
      </Link>
      <Link
        to="/products"
        className="text-center text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        Continue shopping
      </Link>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Your cart
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
            {count} item{count === 1 ? "" : "s"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => { clearCart(); showToast("Cart cleared", "info"); }}
          className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-red-700 dark:hover:text-red-400"
        >
          Clear cart
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
        {/* Item list */}
        <div className="flex flex-col gap-3">
          {items.map(({ product, quantity }) => (
            <div
              key={product.id}
              className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {/* Thumbnail */}
              <Link
                to={`/products/${product.id}`}
                className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 sm:h-24 sm:w-24"
                aria-label={`View ${product.name}`}
              >
                {product.image ? (
                  <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.gradient} text-3xl`}>
                    {product.emoji}
                  </div>
                )}
              </Link>

              {/* Details */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {product.category}
                    </p>
                    <Link
                      to={`/products/${product.id}`}
                      className="mt-0.5 block truncate text-sm font-semibold text-zinc-900 transition-colors hover:text-violet-600 dark:text-zinc-50 dark:hover:text-violet-400"
                    >
                      {product.name}
                    </Link>
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    aria-label={`Remove ${product.name}`}
                    onClick={() => removeItem(product.id)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Quantity + price */}
                <div className="mt-auto flex items-center justify-between gap-3">
                  {/* Quantity stepper */}
                  <div className="flex items-center rounded-full border border-zinc-200 dark:border-zinc-700">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center text-base text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => updateQuantity(product.id, Math.min(product.stock, quantity + 1))}
                      className="flex h-8 w-8 items-center justify-center text-base text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      +
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{formatPrice(product.price)} each</p>
                    <p className="text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary — sticky on md+ */}
        <div className="md:sticky md:top-24 md:self-start">
          {OrderSummary}
        </div>
      </div>
    </div>
  );
}
