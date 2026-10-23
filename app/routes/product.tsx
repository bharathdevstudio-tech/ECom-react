import { Form, Link, data, redirect, useActionData, useNavigation } from "react-router";
import type { Route } from "./+types/product";
import {
  addReview,
  askProductQuestion,
  getAllProducts,
  getProduct,
  getProductFeatures,
  getProductQuestions,
  getReviews,
  getUserFromSession,
  getUserReview,
} from "@/server/db";
import { getSessionId } from "@/server/session";
import { formatPrice, getDiscountPercent } from "@/lib/format";
import AddToCartButton from "@/components/product/AddToCartButton";
import RecordView from "@/components/product/RecordView";
import WishlistButton from "@/components/product/WishlistButton";
import ProductCard from "@/components/product/ProductCard";

export function meta({ data: loaderData }: Route.MetaArgs) {
  if (!loaderData?.product) return [{ title: "Product not found — Nova Store" }];
  const { product, origin } = loaderData;
  const url = `${origin}/products/${product.id}`;
  return [
    { title: `${product.name} — Nova Store` },
    { name: "description", content: product.tagline },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:type", content: "product" },
    { property: "og:title", content: product.name },
    { property: "og:description", content: product.tagline },
    { property: "og:url", content: url },
    ...(product.image ? [{ property: "og:image", content: `${origin}${product.image}` }] : []),
  ];
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

export async function loader({ params, request }: Route.LoaderArgs) {
  const product = await getProduct(params.id);
  if (!product) throw data(null, { status: 404 });
  const features = await getProductFeatures(params.id);
  const reviews = await getReviews(params.id);
  const related = (await getAllProducts())
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // `getSessionId` may mint a throwaway id for anonymous visitors; that is
  // fine because no user will be found for it and no cookie is written.
  const sessionId = await getSessionId(request);
  const user = await getUserFromSession(sessionId);
  const userReview = user ? await getUserReview(params.id, user.id) : undefined;
  const questions = await getProductQuestions(params.id);

  return {
    product,
    features,
    reviews,
    questions,
    related,
    user,
    userReview,
    origin: new URL(request.url).origin,
  };
}

export async function action({ request, params }: Route.ActionArgs) {
  const sessionId = await getSessionId(request);
  const user = await getUserFromSession(sessionId);

  const form = await request.formData();
  const intent = form.get("intent") === "question" ? "question" : "review";

  if (!user) {
    return {
      intent,
      error:
        intent === "question"
          ? "Please sign in to ask a question."
          : "Please sign in to write a review.",
    };
  }

  try {
    if (intent === "question") {
      await askProductQuestion(
        params.id,
        user.id,
        user.name,
        String(form.get("question") ?? ""),
      );
    } else {
      await addReview(params.id, user.id, user.name, {
        rating: Number(form.get("rating") ?? 0),
        title: String(form.get("title") ?? ""),
        body: String(form.get("body") ?? ""),
      });
    }
  } catch (err) {
    return {
      intent,
      error: err instanceof Error ? err.message : "Could not save your submission.",
    };
  }

  // Redirect after a successful POST so a refresh cannot resubmit the form.
  return redirect(`/products/${params.id}${intent === "question" ? "#questions" : "#reviews"}`);
}

export default function ProductPage({ loaderData }: Route.ComponentProps) {
  const { product, features, reviews, questions, related, user, userReview, origin } = loaderData;
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submitting = navigation.state === "submitting";
  const discount = getDiscountPercent(product);
  const specs = categorySpecs[product.category] ?? [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.id,
    category: product.category,
    brand: { "@type": "Brand", name: product.name.split(" ")[0] },
    ...(product.image ? { image: `${origin}${product.image}` } : {}),
    offers: {
      "@type": "Offer",
      url: `${origin}/products/${product.id}`,
      priceCurrency: "USD",
      price: product.price.toFixed(2),
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.reviews > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
        }
      : {}),
  };

  return (
    <div className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <RecordView productId={product.id} />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400" aria-label="Breadcrumb">
          <Link to="/" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/products" className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50">Shop</Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-zinc-900 dark:text-zinc-50">{product.name}</span>
        </nav>

        {/* ── Hero: image + info ───────────────────────────── */}
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">

          {/* Image column — sticky on lg+ */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* Main image */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className={`aspect-[4/3] w-full bg-gradient-to-br ${product.gradient} flex items-center justify-center text-8xl`}>
                  {product.emoji}
                </div>
              )}
              {discount !== null && (
                <span className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg">
                  Sale −{discount}%
                </span>
              )}
            </div>

            {/* Trust badges */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
              {[
                { icon: "🚚", label: "Free shipping", sub: "On all orders" },
                { icon: "🔄", label: "30-day returns", sub: "No questions" },
                { icon: "🛡️", label: "2-year warranty", sub: "Peace of mind" },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="rounded-xl bg-zinc-100 px-2 py-3 dark:bg-zinc-900 sm:rounded-2xl sm:px-3 sm:py-4">
                  <div className="text-xl" aria-hidden="true">{icon}</div>
                  <div className="mt-1 text-xs font-semibold text-zinc-900 dark:text-zinc-50 sm:text-sm">{label}</div>
                  <div className="text-[10px] text-zinc-500 dark:text-zinc-400 sm:text-xs">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Info column */}
          <div className="flex flex-col gap-6">

            {/* Category + wishlist */}
            <div className="flex items-center justify-between gap-4">
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                {product.category}
              </span>
              <WishlistButton productId={product.id} />
            </div>

            {/* Name + tagline */}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl lg:text-4xl">
                {product.name}
              </h1>
              <p className="mt-2 text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                {product.tagline}
              </p>
            </div>

            {/* Rating + stock */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-50">
                <span className="text-amber-500" aria-hidden="true">★</span>
                {product.rating.toFixed(1)}
              </span>
              <span className="text-zinc-400 dark:text-zinc-500">· {product.reviews} reviews</span>
              <span
                className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
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

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-extrabold tabular-nums text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                {formatPrice(product.price)}
              </span>
              {product.compareAt && (
                <span className="text-lg text-zinc-400 line-through dark:text-zinc-500">
                  {formatPrice(product.compareAt)}
                </span>
              )}
              {discount !== null && product.compareAt && (
                <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                  Save {formatPrice(product.compareAt - product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="leading-7 text-zinc-600 dark:text-zinc-300">
              {product.description}
            </p>

            {/* Feature list */}
            {features.length > 0 && (
              <ul className="flex flex-col gap-2.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
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

            {/* Add to cart */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <AddToCartButton product={product} showQuantity />
            </div>

            {/* Key specs */}
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
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{label}</dt>
                      <dd className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}
          </div>
        </div>

        {/* ── Reviews ─────────────────────────────────────── */}
        <section id="reviews" aria-labelledby="reviews-heading" className="mt-16 scroll-mt-24 sm:mt-20">
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

          {/* Write a review */}
          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            {!user ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Bought this product?{" "}
                <Link
                  to={`/login?redirect=/products/${product.id}`}
                  className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  Sign in
                </Link>{" "}
                to write a review.
              </p>
            ) : userReview ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Thanks for your review!
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">
                  You rated this {userReview.rating}/5 on {userReview.date}.
                </span>
              </div>
            ) : (
              <Form method="post" className="flex flex-col gap-4">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Write a review</h3>

                {actionData?.error && actionData.intent !== "question" && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
                    {actionData.error}
                  </p>
                )}

                <div className="grid gap-4 sm:grid-cols-[150px_1fr]">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      Rating
                    </span>
                    <select
                      name="rating"
                      defaultValue="5"
                      className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {"★".repeat(n)}{"☆".repeat(5 - n)} ({n}/5)
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                      Title
                    </span>
                    <input
                      name="title"
                      required
                      minLength={3}
                      maxLength={120}
                      placeholder="Sums up your experience"
                      className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Review
                  </span>
                  <textarea
                    name="body"
                    required
                    minLength={10}
                    maxLength={2000}
                    rows={4}
                    placeholder="What did you like or dislike?"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
                >
                  {submitting ? "Posting…" : "Post review"}
                </button>
              </Form>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
              {reviews.map((review) => (
                <figure
                  key={`${review.userId ?? review.author}-${review.date}`}
                  className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:w-auto sm:rounded-3xl sm:p-6"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className="text-sm text-amber-500"
                      aria-label={`${review.rating} out of 5 stars`}
                    >
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} aria-hidden="true">{i < review.rating ? "★" : "☆"}</span>
                      ))}
                    </div>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">{review.date}</span>
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
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No reviews yet — be the first to share your thoughts.
            </p>
          )}
        </section>

        {/* ── Questions & answers ─────────────────────────── */}
        <section id="questions" aria-labelledby="questions-heading" className="mt-16 scroll-mt-24 sm:mt-20">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              Ask before you buy
            </p>
            <h2
              id="questions-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
            >
              Questions &amp; answers
            </h2>
          </div>

          <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
            {!user ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-300">
                Have a question about this product?{" "}
                <Link
                  to={`/login?redirect=${encodeURIComponent(`/products/${product.id}#questions`)}`}
                  className="font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  Sign in
                </Link>{" "}
                to ask. We publish answered questions for everyone to see.
              </p>
            ) : (
              <Form method="post" className="flex flex-col gap-3">
                <input type="hidden" name="intent" value="question" />
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Your question
                  </span>
                  <textarea
                    name="question"
                    required
                    minLength={10}
                    maxLength={1000}
                    rows={3}
                    placeholder="What would you like to know about this product?"
                    className="w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
                  />
                </label>
                {actionData?.error && actionData.intent === "question" && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
                    {actionData.error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
                >
                  {submitting ? "Sending…" : "Ask question"}
                </button>
              </Form>
            )}
          </div>

          {questions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              No answered questions yet. Be the first to ask!
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                      {item.question}
                    </p>
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                      {item.author} · {item.created_at.slice(0, 10)}
                    </span>
                  </div>
                  {item.answer && (
                    <div className="mt-3 rounded-xl bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                        Nova Store answer
                      </p>
                      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{item.answer}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ── Related products ─────────────────────────────── */}
        {related.length > 0 && (
          <section className="mt-16 sm:mt-20">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                  Keep exploring
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  You may also like
                </h2>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(product.category)}`}
                className="shrink-0 text-sm font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
              >
                View all →
              </Link>
            </div>

            {/* Horizontal scroll on mobile, grid on sm+ */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
              {related.map((item) => (
                <div key={item.id} className="w-64 shrink-0 sm:w-auto">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
