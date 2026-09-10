import { useWishlist } from "@/components/wishlist/WishlistContext";
import { useToast } from "@/components/ui/Toast";

export default function WishlistButton({
  productId,
  size = "md",
}: {
  productId: string;
  size?: "sm" | "md";
}) {
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const active = isWishlisted(productId);

  // Both sizes now meet 44px minimum touch target via padding trick:
  // sm: visual 32px circle inside a 44px tap area
  // md: 44px circle
  const containerCls = size === "sm"
    ? "flex h-11 w-11 items-center justify-center"   // 44px tap area
    : "flex h-11 w-11 items-center justify-center";

  const circleCls = size === "sm"
    ? "h-8 w-8 shadow-md"
    : "h-11 w-11 shadow-lg";

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(productId);
        showToast(
          added ? "Added to wishlist" : "Removed from wishlist",
          added ? "success" : "info",
        );
      }}
      className={`${containerCls} rounded-full transition-transform active:scale-90`}
    >
      <span
        className={`${circleCls} inline-flex shrink-0 items-center justify-center rounded-full border backdrop-blur transition-all hover:scale-110 ${
          active
            ? "border-pink-300 bg-white text-pink-500 dark:border-pink-500/60 dark:bg-zinc-900 dark:text-pink-400"
            : "border-zinc-200/80 bg-white/90 text-zinc-400 hover:text-pink-500 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-500 dark:hover:text-pink-400"
        }`}
        aria-hidden="true"
      >
        <svg
          className={active ? "h-4 w-4 fill-current" : "h-4 w-4"}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.8"
          fill="none"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
          />
        </svg>
      </span>
    </button>
  );
}
