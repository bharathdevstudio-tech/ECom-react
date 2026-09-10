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

  const all = getAllProducts();
  const base = category === "all" ? all : all.filter((p) => p.category === category);
  const filtered = searchProducts(base, q, sort);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PER_PAGE;
  const pageProducts = filtered.slice(start, start + PER_PAGE);
  const categories = getCategories();

  return { pageProducts, filtered, categories, active: category, sort, q, page: safePage, totalPages, start };
}

export default function ShopPage({ loaderData }: Route.ComponentProps) {
  const { pageProducts, filtered, categories, active, sort, q, page: safePage, totalPages, start } = loaderData;
  const hasQuery = Boolean(q?.trim());

  const query = new URLSearchParams();
  if (active !== "all") query.set("category", active);
  if (q) query.set("q", q);
  if (sort !== "featured") query.set("sort", sort);

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
