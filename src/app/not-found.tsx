import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-32 text-center sm:px-6">
      <span className="text-6xl" aria-hidden="true">
        🔍
      </span>
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
        404
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Page not found
      </h1>
      <p className="max-w-md text-zinc-500 dark:text-zinc-400">
        The page you are looking for doesn&apos;t exist or may have been
        moved. Let&apos;s get you back to the shop.
      </p>
      <Link
        href="/products"
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-7 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.03] active:scale-[0.98]"
      >
        Browse all products
      </Link>
    </div>
  );
}