import { Link } from "react-router";

const shopLinks = [
  { href: "/products", label: "All products" },
  { href: "/products?category=Audio", label: "Audio" },
  { href: "/products?category=Wearables", label: "Wearables" },
  { href: "/products?category=Accessories", label: "Accessories" },
  { href: "/products?category=Drones", label: "Drones" },
];

const helpLinks = [
  { href: "/cart", label: "Your cart" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/checkout", label: "Checkout" },
  { href: "/order-confirmation", label: "Track an order" },
];

const badges = ["Visa", "Mastercard", "PayPal", "Apple Pay"];

export default function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-14">

        {/* Main grid — 1 col → 2 col → 4 col */}
        <div className="grid grid-cols-2 gap-8 sm:gap-10 lg:grid-cols-4">

          {/* Brand — full width on smallest, spans 2 cols on mobile */}
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Nova Store home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-bold text-white">
                N
              </span>
              <span className="text-base font-bold text-zinc-900 dark:text-zinc-50">Nova Store</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              Premium gadgets and accessories for the modern lifestyle. Free shipping over $100,
              30-day returns and a 2-year warranty on everything we sell.
            </p>
            {/* Trust badges */}
            <div className="mt-5 flex flex-wrap gap-2">
              {["🚚 Free shipping", "↩️ 30-day returns", "🔒 Secure checkout"].map((b) => (
                <span
                  key={b}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Shop
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-600 transition-colors hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Help
            </h3>
            <ul className="mt-4 flex flex-col gap-3">
              {helpLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-zinc-600 transition-colors hover:text-violet-600 dark:text-zinc-300 dark:hover:text-violet-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links CTA block */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Quick access
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                to="/products"
                className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Browse all products →
              </Link>
              <Link
                to="/cart"
                className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
              >
                View cart
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800 sm:flex-row">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            © {new Date().getFullYear()} Nova Store. Demo store — data stored locally in SQLite.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {badges.map((b) => (
              <span
                key={b}
                className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
