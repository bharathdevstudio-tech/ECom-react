import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllProducts,
  getProduct,
  getProductFeatures,
  getReviews,
} from "@/server/db";
import { formatPrice, getDiscountPercent } from "@/lib/format";
import AddToCartButton from "@/components/product/AddToCartButton";
import RecordView from "@/components/product/RecordView";
import WishlistButton from "@/components/product/WishlistButton";
import ProductCard from "@/components/product/ProductCard";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.tagline,
  };
}

const categorySpecs: Record<string, [string, string][]> = {
  Audio: [
    ["Battery life", "40 hours"],
    ["Connectivity", "Bluetooth 5.3, 3.5 mm"],
    ["Charging", "USB-C fast charge"],
    ["Weight", "280 g"],
  ],
  Wearables: [
    ["Battery", "Up to 10 days"],
    ["Display", 'AMOLED 1.43"'],
    ["Water resistance", "5 ATM"],
    ["Sensors", "HR, SpO2, GPS"],
  ],
  Accessories: [
    ["Connectivity", "USB-C"],
    ["Compatibility", "Mac, Windows, Linux"],
    ["Warranty", "2 years"],
    ["In the box", "Device + cable"],
  ],
  Tablets: [
    ["Display", '7" e-ink'],
    ["Storage", "16 GB"],
    ["Battery", "Up to 6 weeks"],
    ["Lighting", "Warm front light"],
  ],
  Drones: [
    ["Camera", "4K / 60 fps"],
    ["Flight time", "30 minutes"],
    ["Gimbal", "3-axis stabilisation"],
    ["Range", "3 km"],
  ],
  Home: [
    ["Light", "2700K – 6500K"],
    ["Power", "15W wireless charging"],
    ["Neck", "Fully adjustable"],
    ["Smart", "App + voice control"],
  ],
  Cameras: [
    ["Sensor", "24 MP APS-C"],
    ["Video", "4K60"],
    ["Stabilisation", "5-axis IBIS"],
    ["Lens", "28 mm f/2.8"],
  ],
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) notFound();

  const discount = getDiscountPercent(product);
  const features = getProductFeatures(id);
  const specs = categorySpecs[product.category] ?? [];
  const reviews = getReviews(id);
  const related = getAllProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="flex-1">
      <RecordView productId={product.id} />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <nav
          className="mb-8 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400"
          aria-label="Breadcrumb"
        >
          <Link
            href="/"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href="/products"
            className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-zinc-900 dark:text-zinc-50">
            {product.name}
          </span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <Image
                src={product.image}
                alt={product.name}
                width={800}
                height={600}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
              {discount !== null && (
                <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                  Sale −{discount}%
                </span>
              )}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center text-sm">
              <div className="rounded-2xl bg-zinc-100 px-3 py-4 dark:bg-zinc-900">
                <div className="text-xl" aria-hidden="true">
                  🚚
                </div>
                <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                  Free shipping
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  On all orders
                </div>
              </div>
              <div className="rounded-2xl bg-zinc-100 px-3 py-4 dark:bg-zinc-900">
                <div className="text-xl" aria-hidden="true">
                  🔄
                </div>
                <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                  30-day returns
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  No questions asked
                </div>
              </div>
              <div className="rounded-2xl bg-zinc-100 px-3 py-4 dark:bg-zinc-900">
                <div className="text-xl" aria-hidden="true">
                  🛡️
                </div>
                <div className="mt-1 font-semibold text-zinc-900 dark:text-zinc-50">
                  2-year warranty
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Peace of mind
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-7">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {product.category}
              </span>
              <WishlistButton productId={product.id} />
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {product.name}
              </h1>
              <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-300">
                {product.tagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="text-amber-500" aria-hidden="true">
                  ★
                </span>
                {product.rating.toFixed(1)}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">
                · {product.reviews} reviews
              </span>
              <span
                className={`ml-auto sm:ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                  product.stock > 10
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    : product.stock > 0
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {product.stock > 10
                  ? "In stock"
                  : product.stock > 0
                    ? `Only ${product.stock} left`
                    : "Out of stock"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-3">
              <span className="text-4xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatPrice(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-xl text-zinc-400 line-through dark:text-zinc-500">
                  {formatPrice(product.compareAt)}
                </span>
              )}
              {discount !== null && product.compareAt && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                  Save {formatPrice(product.compareAt - product.price)}
                </span>
              )}
            </div>

            <p className="leading-7 text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>

            {features.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            )}

            <hr className="border-zinc-200 dark:border-zinc-800" />

            <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <AddToCartButton product={product} showQuantity />
            </div>

            {specs.length > 0 && (
              <section aria-labelledby="specs-heading">
                <h2
                  id="specs-heading"
                  className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500"
                >
                  Key specs
                </h2>
                <dl className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {specs.map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900"
                    >
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">
                        {label}
                      </dt>
                      <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>

        <section aria-labelledby="reviews-heading" className="mt-20">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Social proof
            </p>
            <h2
              id="reviews-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Customer reviews
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {reviews.map((review) => (
              <figure
                key={`${review.author}-${review.date}`}
                className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="text-sm text-amber-500"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} aria-hidden="true">
                        {i < review.rating ? "★" : "☆"}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {review.date}
                  </span>
                </div>
                <figcaption className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {review.title}
                </figcaption>
                <blockquote className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {review.body}
                </blockquote>
                <footer className="mt-auto pt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  — {review.author}
                  {review.verified && (
                    <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Verified
                    </span>
                  )}
                </footer>
              </figure>
            ))}
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-20">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  Keep exploring
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  You may also like
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
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}