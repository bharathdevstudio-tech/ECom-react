import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  getAllProducts,
  getCategories,
  searchProducts,
} from "@/server/db";
import type { SortKey } from "@/lib/types";
import ProductCard from "@/components/product/ProductCard";
import ShopToolbar from "@/components/product/ShopToolbar";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse the full Nova Store catalog of gadgets and accessories.",
};

export const PER_PAGE = 24;

type ShopPageProps = {
  searchParams: Promise<{
    category?: string;
    q?: string;
    sort?: string;
    page?: string;
  }>;
};

function paginationItems(totalPages: number, current: number): (number | "…")[] {
  const items: (number | "…")[] = [];
  const pushPage = (page: number) => {
    if (items[items.length - 1] !== page) items.push(page);
  };
  for (let page = 1; page <= totalPages; page++) {
    if (
      page === 1 ||
      page === totalPages ||
      Math.abs(page - current) <= 1
    ) {
      pushPage(page);
    } else if (items[items.length - 1] !== "…") {
      items.push("…");
    }
  }
  return items;
}

function buildHref(
  base: URLSearchParams,
  patch: Record<string, string | null>,
): string {
  const next = new URLSearchParams(base);
  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else next.set(key, value);
  }
  const query = next.toString();
  return query ? `/products?${query}` : "/products";
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const active = params.category ?? "all";
  const sort = (params.sort as SortKey) || "featured";
  const page = Math.max(1, Number(params.page) || 1);

  const all = getAllProducts();
  const base =
    active === "all"
      ? all
      : all.filter((product) => product.category === active);
  const filtered = searchProducts(base, params.q ?? "", sort);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageProducts = filtered.slice(start, start + PER_PAGE);

  const hasQuery = Boolean(params.q?.trim());
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          The catalog
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Shop all products
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Showing{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {filtered.length === 0 ? 0 : start + 1}–
            {Math.min(start + PER_PAGE, filtered.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {filtered.length}
          </span>{" "}
          result{filtered.length === 1 ? "" : "s"}
          {active !== "all" ? ` in ${active}` : ""}
          {hasQuery ? ` for "${params.q}"` : ""}
        </p>
      </div>

      <div className="mb-10 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <Suspense fallback={<div className="h-24" />}>
          <ShopToolbar categories={getCategories()} activeCategory={active} />
        </Suspense>
      </div>

      {pageProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pageProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-12 flex flex-wrap items-center justify-center gap-2"
            >
              <Link
                href={buildHref(query, { page: String(safePage - 1) })}
                aria-disabled={safePage === 1}
                tabIndex={safePage === 1 ? -1 : undefined}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors ${
                  safePage === 1
                    ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-700 hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                }`}
              >
                ← Prev
              </Link>

              {paginationItems(totalPages, safePage).map((item, index) =>
                item === "…" ? (
                  <span
                    key={`gap-${index}`}
                    className="px-2 text-sm text-zinc-400 dark:text-zinc-500"
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    href={buildHref(query, { page: String(item) })}
                    aria-current={item === safePage ? "page" : undefined}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      item === safePage
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "border border-zinc-300 text-zinc-700 hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                    }`}
                  >
                    {item}
                  </Link>
                ),
              )}

              <Link
                href={buildHref(query, { page: String(safePage + 1) })}
                aria-disabled={safePage === totalPages}
                tabIndex={safePage === totalPages ? -1 : undefined}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors ${
                  safePage === totalPages
                    ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-700 hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                }`}
              >
                Next →
              </Link>
            </nav>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-zinc-300 py-20 text-center dark:border-zinc-700">
          <span className="text-5xl" aria-hidden="true">
            🧺
          </span>
          <p className="font-medium text-zinc-700 dark:text-zinc-200">
            No products match{hasQuery ? " your search" : ""}.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Try a different keyword or category.
          </p>
          <Link
            href="/products"
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition-transform hover:scale-105 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}