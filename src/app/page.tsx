import Image from "next/image";
import Link from "next/link";
import {
  getAllProducts,
  getCategories,
  getFeaturedProducts,
} from "@/server/db";
import ProductCard from "@/components/product/ProductCard";
import RecentlyViewed from "@/components/product/RecentlyViewed";

export default function HomePage() {
  const featured = getFeaturedProducts();
  const categories = getCategories();
  const total = getAllProducts().length;
  const collage = featured.slice(0, 4);

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden bg-zinc-950 text-white">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55rem 30rem at 82% -15%, rgba(139,92,246,0.4), transparent 60%), radial-gradient(45rem 28rem at 8% 115%, rgba(79,70,229,0.32), transparent 60%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(60rem 32rem at 70% 20%, black, transparent)",
            WebkitMaskImage:
              "radial-gradient(60rem 32rem at 70% 20%, black, transparent)",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div className="flex flex-col items-start gap-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-violet-200 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
              New season · New drops
            </span>
            <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Gadgets that keep{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                up with you
              </span>
            </h1>
            <p className="max-w-md text-lg leading-8 text-zinc-300">
              Curated audio, wearables and accessories — engineered for
              everyday life, delivered fast and free.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-900/50 transition-transform hover:scale-[1.03] active:scale-[0.98]"
              >
                Shop the collection
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                href="/products?category=Audio"
                className="inline-flex h-12 items-center justify-center rounded-full border border-white/20 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore audio
              </Link>
            </div>

            <dl className="mt-4 flex flex-wrap gap-x-10 gap-y-6 text-sm">
              <div className="min-w-[45%]">
                <dt className="text-zinc-400">Products</dt>
                <dd className="mt-1 text-3xl font-extrabold tabular-nums">
                  {total}
                </dd>
              </div>
              <div className="min-w-[45%]">
                <dt className="text-zinc-400">Categories</dt>
                <dd className="mt-1 text-3xl font-extrabold tabular-nums">
                  {categories.length}
                </dd>
              </div>
              <div className="min-w-[45%]">
                <dt className="text-zinc-400">Avg. rating</dt>
                <dd className="mt-1 text-3xl font-extrabold tabular-nums">
                  4.6<span className="text-violet-300">★</span>
                </dd>
              </div>
              <div className="min-w-[45%]">
                <dt className="text-zinc-400">Shipping</dt>
                <dd className="mt-1 text-3xl font-extrabold">Free</dd>
              </div>
            </dl>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-violet-600/40 to-indigo-500/20 blur-2xl"
              aria-hidden="true"
            />
            <div className="relative grid grid-cols-2 gap-4">
              {collage.map((product, index) => (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className={`group relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-transform duration-300 hover:scale-[1.03] ${
                    index % 3 === 1 ? "translate-y-6" : ""
                  }`}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={800}
                    height={600}
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="text-xs font-medium text-white/70">{product.category}</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-white">
                      {product.name}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="absolute -right-4 top-8 hidden rotate-3 rounded-2xl border border-white/10 bg-white/95 px-4 py-3 shadow-xl backdrop-blur sm:block dark:bg-zinc-900/95">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-base dark:bg-violet-500/20">
                  🚀
                </span>
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                    2-day delivery
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Free over $100
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Browse by category
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Find your thing
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <Link
              key={category}
              href={`/products?category=${encodeURIComponent(category)}`}
              className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-700 transition-all hover:-translate-y-0.5 hover:border-violet-400 hover:text-violet-700 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-violet-500/60 dark:hover:text-violet-300"
            >
              {category}
              <span className="text-zinc-300 dark:text-zinc-600" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-8 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Hand-picked
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Featured products
            </h2>
          </div>
          <Link
            href="/products"
            className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.slice(0, 6).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <RecentlyViewed />
    </div>
  );
}