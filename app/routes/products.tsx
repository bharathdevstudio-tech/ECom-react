import { Link, useSearchParams } from "react-router";
import type { Route } from "./+types/products";
import { getAllProducts, getCategories, searchProducts } from "@/server/db";
import type { SortKey } from "@/lib/types";
import ProductCard from "@/components/product/ProductCard";
import ShopToolbar from "@/components/product/ShopToolbar";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Shop — Nova Store" },
    { name: "description", content: "Browse the full Nova Store catalog of gadgets and accessories." },
  ];
}

export const PER_PAGE = 24;

function paginationItems(totalPages: number, current: number): (number | "…")[] {
  const items: (number | "…")[] = [];
  const push = (page: number) => {
    if (items[items.length - 1] !== page) items.push(page);
  };
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - current) <= 1) push(p);
    else if (items[items.length - 1] !== "…") items.push("…");
  }
  return items;
}

function buildHref(base: URLSearchParams, patch: Record<string, string | null>): string {
  const next = new URLSearchParams(base);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null) next.delete(k);
    else next.set(k, v);
  }
  const qs = next.toString();
  return qs ? `/products?${qs}` : "/products";
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category") ?? "all";
  const sort = (url.searchParams.get("sort") as SortKey) || "featured";
  const q = url.searchParams.get("q") ?? "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const minPriceRaw = Number(url.searchParams.get("minPrice"));
  const maxPriceRaw = Number(url.searchParams.get("maxPrice"));
  const minPrice = Number.isFinite(minPriceRaw) && url.searchParams.get("minPrice") ? minPriceRaw : null;
  const maxPrice = Number.isFinite(maxPriceRaw) && url.searchParams.get("maxPrice") ? maxPriceRaw : null;
  const minRatingRaw = Number(url.searchParams.get("minRating"));
  const minRating = Number.isFinite(minRatingRaw) && url.searchParams.get("minRating") ? minRatingRaw : null;
  const inStockOnly = url.searchParams.get("stock") === "1";

  const all = await getAllProducts();
  const base = category === "all" ? all : all.filter((p) => p.category === category);
  let filtered = searchProducts(base, q, sort);
  if (minPrice !== null) filtered = filtered.filter((p) => p.price >= minPrice);
  if (maxPrice !== null) filtered = filtered.filter((p) => p.price <= maxPrice);
  if (minRating !== null) filtered = filtered.filter((p) => p.rating >= minRating);
  if (inStockOnly) filtered = filtered.filter((p) => p.stock > 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageProducts = filtered.slice(start, start + PER_PAGE);
  const categories = await getCategories();

  return {
    pageProducts, filtered, categories, active: category, sort, q, page: safePage, totalPages, start,
    minPrice, maxPrice, minRating, inStockOnly,
  };
}

export default function ShopPage({ loaderData }: Route.ComponentProps) {
  const {
    pageProducts, filtered, categories, active, sort, q, page: safePage, totalPages, start,
    minPrice, maxPrice, minRating, inStockOnly,
  } = loaderData;
  const hasQuery = Boolean(q?.trim());

  const query = new URLSearchParams();
  if (active !== "all") query.set("category", active);
  if (q) query.set("q", q);
  if (sort !== "featured") query.set("sort", sort);
  if (minPrice !== null) query.set("minPrice", String(minPrice));
  if (maxPrice !== null) query.set("maxPrice", String(maxPrice));
  if (minRating !== null) query.set("minRating", String(minRating));
  if (inStockOnly) query.set("stock", "1");

  const activeFilters: { label: string; patch: Record<string, string | null> }[] = [];
  if (hasQuery) activeFilters.push({ label: `“${q}”`, patch: { q: null } });
  if (minPrice !== null) activeFilters.push({ label: `From $${minPrice}`, patch: { minPrice: null } });
  if (maxPrice !== null) activeFilters.push({ label: `Up to $${maxPrice}`, patch: { maxPrice: null } });
  if (minRating !== null) activeFilters.push({ label: `${minRating}★ & up`, patch: { minRating: null } });
  if (inStockOnly) activeFilters.push({ label: "In stock", patch: { stock: null } });
  const hasFilters = activeFilters.length > 0 || active !== "all";

  function chipHref(patch: Record<string, string | null>): string {
    const next = new URLSearchParams(query);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    next.delete("page");
    return `/products${next.toString() ? `?${next}` : ""}`;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* Page header */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          The catalog
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          Shop all products
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Showing{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + PER_PAGE, filtered.length)}
          </span>{" "}
          of{" "}
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{filtered.length}</span>{" "}
          result{filtered.length === 1 ? "" : "s"}
          {active !== "all" ? ` in ${active}` : ""}
          {hasQuery ? ` for "${q}"` : ""}
        </p>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            Filters
          </span>
          {active !== "all" && (
            <Link
              to={chipHref({ category: null })}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:hover:bg-violet-900/60"
            >
              {active} <span aria-hidden="true">✕</span>
            </Link>
          )}
          {activeFilters.map((filter) => (
            <Link
              key={filter.label}
              to={chipHref(filter.patch)}
              className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              {filter.label} <span aria-hidden="true">✕</span>
            </Link>
          ))}
          <Link
            to="/products"
            className="text-xs font-medium text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Clear all
          </Link>
        </div>
      )}

      {/* Toolbar */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-3xl sm:p-5">
        <ShopToolbar categories={categories} activeCategory={active} />
      </div>

      {/* Grid */}
      {pageProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 md:grid-cols-3 lg:gap-6">
            {pageProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Pagination"
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
            >
              <Link
                to={buildHref(query, { page: String(safePage - 1) })}
                aria-disabled={safePage === 1}
                aria-label="Previous page"
                tabIndex={safePage === 1 ? -1 : undefined}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors sm:px-5 ${
                  safePage === 1
                    ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-700 hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                }`}
              >
                ← <span className="hidden sm:inline ml-1">Prev</span>
              </Link>

              {paginationItems(totalPages, safePage).map((item, index) =>
                item === "…" ? (
                  <span key={`gap-${index}`} className="px-1.5 text-sm text-zinc-400 dark:text-zinc-500">
                    …
                  </span>
                ) : (
                  <Link
                    key={item}
                    to={buildHref(query, { page: String(item) })}
                    aria-current={item === safePage ? "page" : undefined}
                    aria-label={`Page ${item}`}
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
                to={buildHref(query, { page: String(safePage + 1) })}
                aria-disabled={safePage === totalPages}
                aria-label="Next page"
                tabIndex={safePage === totalPages ? -1 : undefined}
                className={`inline-flex h-10 items-center justify-center rounded-full border px-4 text-sm font-medium transition-colors sm:px-5 ${
                  safePage === totalPages
                    ? "pointer-events-none border-zinc-200 text-zinc-300 dark:border-zinc-800 dark:text-zinc-600"
                    : "border-zinc-300 text-zinc-700 hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                }`}
              >
                <span className="hidden sm:inline mr-1">Next</span> →
              </Link>
            </nav>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-zinc-300 py-20 text-center dark:border-zinc-700">
          <span className="text-5xl" aria-hidden="true">🧺</span>
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-200">
              No products match{hasQuery ? " your search" : ""}.
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Try a different keyword or category.
            </p>
          </div>
          <Link
            to="/products"
            className="mt-2 inline-flex h-11 items-center justify-center rounded-full bg-zinc-900 px-6 text-sm font-semibold text-white transition-transform hover:scale-105 dark:bg-zinc-50 dark:text-zinc-900"
          >
            Clear filters
          </Link>
        </div>
      )}
    </div>
  );
}
