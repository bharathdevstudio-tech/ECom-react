import { useState } from "react";
import { useCart } from "@/components/cart/CartContext";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/lib/types";

export default function AddToCartButton({
  product,
  showQuantity = false,
}: {
  product: Product;
  showQuantity?: boolean;
}) {
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const outOfStock = product.stock <= 0;

  function handleAdd() {
    if (outOfStock) return;
    addItem(product, quantity);
    setAdded(true);
    showToast(`${product.name} added to cart`, "success");
    window.setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="flex flex-col gap-3">
      {showQuantity && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Quantity
          </span>
          <div className="flex items-center rounded-full border border-zinc-300 dark:border-zinc-700">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-11 w-11 items-center justify-center text-lg text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              className="flex h-11 w-11 items-center justify-center text-lg text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
            >
              +
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all active:scale-[0.98] ${
          added
            ? "bg-emerald-600 text-white"
            : outOfStock
              ? "cursor-not-allowed bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
              : "bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20 hover:shadow-lg hover:shadow-violet-600/30"
        }`}
      >
        {added ? (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Added
          </>
        ) : outOfStock ? (
          "Out of stock"
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            Add to cart
          </>
        )}
      </button>
    </div>
  );
}
