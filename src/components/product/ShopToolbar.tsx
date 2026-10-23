import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import type { SortKey } from "@/lib/types";

const sortLabels: Record<SortKey, string> = {
  featured: "Featured",
  "price-asc": "Price: Low → High",
  "price-desc": "Price: High → Low",
  rating: "Top rated",
};

const filterKeys = ["minPrice", "maxPrice", "minRating", "stock"] as const;

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
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [minRating, setMinRating] = useState(searchParams.get("minRating") ?? "");
  const [stock, setStock] = useState(searchParams.get("stock") === "1");

  const activeFilterCount = useMemo(
    () => filterKeys.filter((key) => searchParams.get(key)).length,
    [searchParams],
  );

  // Keep the local controls in sync when the URL changes from outside (e.g.
  // clicking a footer category link or the browser back button).
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setMinPrice(searchParams.get("minPrice") ?? "");
    setMaxPrice(searchParams.get("maxPrice") ?? "");
    setMinRating(searchParams.get("minRating") ?? "");
    setStock(searchParams.get("stock") === "1");
  }, [searchParams]);

  // Debounced search — preserves every other active filter.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query.trim() === current) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      params.delete("page");
      navigate(`/products${params.toString() ? `?${params}` : ""}`, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [query, searchParams, navigate]);

  function buildHref(overrides: { category?: string; sort?: SortKey; q?: string }): string {
    const params = new URLSearchParams(searchParams);
    const category = overrides.category ?? activeCategory;
    const q = overrides.q ?? query;
    const nextSort = overrides.sort ?? sort;
    if (category !== "all") params.set("category", category);
    else params.delete("category");
    if (q.trim()) params.set("q", q.trim());
    else params.delete("q");
    if (nextSort !== "featured") params.set("sort", nextSort);
    else params.delete("sort");
    params.delete("page");
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  }

  function applyFilters() {
    const params = new URLSearchParams(searchParams);
    const entries: [string, string][] = [
      ["minPrice", minPrice.trim()],
      ["maxPrice", maxPrice.trim()],
      ["minRating", minRating],
      ["stock", stock ? "1" : ""],
    ];
    for (const [key, value] of entries) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    setFiltersOpen(false);
    navigate(`/products${params.toString() ? `?${params}` : ""}`);
  }

  function clearFilters() {
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setStock(false);
    const params = new URLSearchParams(searchParams);
    for (const key of filterKeys) params.delete(key);
    params.delete("page");
    navigate(`/products${params.toString() ? `?${params}` : ""}`);
  }

  const allCategories = ["all", ...categories];
  const hasAdvancedFilters = minPrice !== "" || maxPrice !== "" || minRating !== "" || stock;

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: Search + Sort + Filters */}
      <div className="flex items-stretch gap-2 sm:gap-3">
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

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
          aria-label="Toggle filters"
          className={`relative flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors sm:px-4 ${
            filtersOpen || activeFilterCount > 0
              ? "border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-600 dark:bg-violet-950/40 dark:text-violet-300"
              : "border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          }`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Category pills */}
      <div className="flex flex-wrap items-center gap-2">
        {allCategories.map((category) => {
          const active = category === activeCategory;
          return (
            <Link
              key={category}
              to={buildHref({ category })}
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

      {/* Row 3: Advanced filters */}
      {filtersOpen && (
        <div className="animate-drawer-in rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/60">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Min price ($)
              </span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Max price ($)
              </span>
              <input
                type="number"
                min={0}
                inputMode="decimal"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Any"
                className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Rating
              </span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              >
                <option value="">Any rating</option>
                <option value="3">3★ &amp; up</option>
                <option value="4">4★ &amp; up</option>
                <option value="4.5">4.5★ &amp; up</option>
              </select>
            </label>
            <label className="flex items-center gap-2 pt-1 text-sm font-medium text-zinc-700 dark:text-zinc-200 sm:pt-6">
              <input
                type="checkbox"
                checked={stock}
                onChange={(e) => setStock(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
              />
              In stock only
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={applyFilters}
              className="h-10 rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Apply filters
            </button>
            {(hasAdvancedFilters || activeFilterCount > 0) && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
