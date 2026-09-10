import { Link } from "react-router";
import type { Product } from "@/lib/types";
import { formatPrice, getDiscountPercent } from "@/lib/format";
import AddToCartButton from "@/components/product/AddToCartButton";
import WishlistButton from "@/components/product/WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  const discount = getDiscountPercent(product);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.gradient} text-5xl`}>
            {product.emoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

        {/* Discount badge */}
        {discount !== null && (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
            −{discount}%
          </span>
        )}

        {/* Out of stock overlay */}
        {product.stock === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
            <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-zinc-800">
              Out of stock
            </span>
          </div>
        )}

        {/* Wishlist — larger touch target */}
        <div className="absolute right-2 top-2">
          <WishlistButton productId={product.id} size="sm" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        {/* Category + Rating row */}
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {product.category}
          </span>
          <span className="flex items-center gap-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <span className="text-amber-500" aria-hidden="true">★</span>
            {product.rating.toFixed(1)}
            <span className="hidden text-zinc-300 sm:inline dark:text-zinc-600"> · {product.reviews}</span>
          </span>
        </div>

        {/* Name */}
        <Link
          to={`/products/${product.id}`}
          className="group/link"
          aria-label={`View ${product.name}`}
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-900 transition-colors group-hover/link:text-violet-600 dark:text-zinc-50 dark:group-hover/link:text-violet-400 sm:text-base">
            {product.name}
          </h3>
        </Link>

        {/* Tagline — hidden on very small screens */}
        <p className="hidden text-xs leading-5 text-zinc-500 dark:text-zinc-400 sm:block sm:text-sm sm:leading-6">
          {product.tagline}
        </p>

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-lg">
            {formatPrice(product.price)}
          </span>
          {product.compareAt && (
            <span className="text-xs text-zinc-400 line-through dark:text-zinc-500 sm:text-sm">
              {formatPrice(product.compareAt)}
            </span>
          )}
        </div>

        {/* CTA */}
        <AddToCartButton product={product} />
      </div>
    </div>
  );
}
