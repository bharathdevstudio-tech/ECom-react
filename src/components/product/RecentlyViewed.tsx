import { useEffect, useSyncExternalStore } from "react";
import { Link } from "react-router";
import type { Product } from "@/lib/types";
import { createBrowserStore } from "@/lib/clientStore";
import ProductCard from "@/components/product/ProductCard";

const recentsStore = createBrowserStore<Product[]>("__nova_recents_store__", []);

export default function RecentlyViewed() {
  const items = useSyncExternalStore(
    recentsStore.subscribe,
    recentsStore.getSnapshot,
    recentsStore.getServerSnapshot,
  );

  useEffect(() => {
    fetch("/api/recent-views")
      .then((r) => r.json())
      .then((products: Product[]) => {
        if (JSON.stringify(products) !== JSON.stringify(recentsStore.get())) {
          recentsStore.replace(products);
        }
      })
      .catch(() => {
        // Ignore fetch failures.
      });
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            Continue browsing
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Recently viewed
          </h2>
        </div>
        <Link
          to="/products"
          className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
        >
          View all →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
