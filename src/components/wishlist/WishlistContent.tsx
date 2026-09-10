import { Link } from "react-router";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import ProductCard from "@/components/product/ProductCard";
import type { Product } from "@/lib/types";

export default function WishlistContent({ products }: { products: Product[] }) {
  const { ids } = useWishlist();
  const wishlisted = products.filter((p) => ids.includes(p.id));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Saved for later
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Your wishlist
        </h1>
        {wishlisted.length > 0 && (
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {wishlisted.length} item{wishlisted.length === 1 ? "" : "s"} saved
          </p>
        )}
      </div>

      {wishlisted.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6">
          {wishlisted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 py-20 text-center dark:border-zinc-700">
          <span className="text-5xl" aria-hidden="true">💜</span>
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">Your wishlist is empty.</p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Tap the heart on any product to save it here.
            </p>
          </div>
          <Link
            to="/products"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-105 active:scale-95"
          >
            Browse products
          </Link>
        </div>
      )}
    </div>
  );
}
