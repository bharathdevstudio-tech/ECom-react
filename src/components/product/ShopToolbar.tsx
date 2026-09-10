import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { SortKey } from "@/lib/types";

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
  rating: "Top rated",
};

export default function ShopToolbar({
  categories,
  activeCategory,
}: {
  categories: string[];
  activeCategory: string;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sort = (searchParams.get("sort") as SortKey) || "featured";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (query.trim()) params.set("q", query.trim());
    if (sort !== "featured") params.set("sort", sort);
    const qs = params.toString();
    const href = `/products${qs ? `?${qs}` : ""}`;
    const timer = setTimeout(() => navigate(href, { replace: true }), 250);
    return () => clearTimeout(timer);
  }, [query, activeCategory, sort, navigate]);

  function buildHref(overrides: { category?: string; sort?: SortKey; q?: string }): string {
    const params = new URLSearchParams();
    const category = overrides.category ?? activeCategory;
    const q = overrides.q ?? query;
    const nextSort = overrides.sort ?? sort;
    if (category !== "all") params.set("category", category);
    if (q.trim()) params.set("q", q.trim());
    if (nextSort !== "featured") params.set("sort", nextSort);
    return `/products${params.toString() ? `?${params}` : ""}`;
  }

  const allCategories = ["all", ...categories];

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Search + Sort */}
      <div className="flex items-stretch gap-2 sm:gap-3">
        {/* Search */}
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
            className="h-11 w-full rounded-full border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => navigate(buildHref({ sort: e.target.value as SortKey }))}
          aria-label="Sort products"
          className="h-11 rounded-full border border-zinc-300 bg-white px-3 pr-8 text-sm font-medium text-zinc-900 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:px-4"
        >
          {Object.entries(sortLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Mobile: filter toggle */}
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-label="Toggle category filters"
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors sm:hidden ${
            activeCategory !== "all"
              ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
              : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          {activeCategory !== "all" && (
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-violet-600" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Row 2: Category pills — always visible on sm+, toggle on mobile */}
      <div className={`${filtersOpen ? "flex" : "hidden sm:flex"} flex-wrap items-center gap-2`}>
        {allCategories.map((category) => {
          const active = category === activeCategory;
          return (
            <Link
              key={category}
              to={buildHref({ category })}
              onClick={() => setFiltersOpen(false)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {category === "all" ? "All" : category}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
