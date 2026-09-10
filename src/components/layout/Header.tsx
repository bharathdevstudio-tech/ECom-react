import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useCart } from "@/components/cart/CartContext";
import { useWishlist } from "@/components/wishlist/WishlistContext";
import { useAuth } from "@/components/auth/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
];

export default function Header() {
  const location = useLocation();
  const pathname = location.pathname;
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => { setMenuOpen(false); setUserOpen(false); }, [pathname]);

  // Outside click for mobile drawer
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: PointerEvent) => {
      const t = e.target as Node;
      if (drawerRef.current?.contains(t) || hamburgerRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menuOpen]);

  // Outside click for user dropdown
  useEffect(() => {
    if (!userOpen) return;
    const handler = (e: PointerEvent) => {
      if (userMenuRef.current?.contains(e.target as Node)) return;
      setUserOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [userOpen]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setMenuOpen(false); setUserOpen(false); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/90 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/90">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">

        {/* Logo */}
        <Link to="/" className="group flex items-center gap-2.5 shrink-0" aria-label="Nova Store home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-base font-bold text-white shadow-md shadow-violet-600/20 transition-transform group-hover:rotate-6">
            N
          </span>
          <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Nova
            <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
              Store
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-violet-700 text-white"
                  : "text-violet-600 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
              }`}
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-1">

          {/* Wishlist */}
          <Link
            to="/wishlist"
            aria-label={`Wishlist${wishlistCount > 0 ? `, ${wishlistCount} items` : ""}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-fuchsia-500 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-fuchsia-400"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
            {wishlistCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-pink-600 px-1 text-[10px] font-bold text-white">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label={`Cart${count > 0 ? `, ${count} items` : ""}`}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-violet-600 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-violet-400"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-1 text-[10px] font-bold text-white">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* User menu (desktop) */}
          <div ref={userMenuRef} className="relative hidden sm:block">
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              aria-expanded={userOpen}
              aria-label={user ? `Account menu for ${user.name}` : "Sign in"}
              className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {user ? (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              )}
            </button>

            {userOpen && (
              <div className="animate-drawer-in absolute right-0 top-full mt-2 w-52 origin-top-right rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                {user ? (
                  <>
                    <div className="px-3 py-2.5">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user.email}</p>
                      {user.role === "admin" && (
                        <span className="mt-1 inline-block rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">
                          Admin
                        </span>
                      )}
                    </div>
                    <hr className="my-1 border-zinc-100 dark:border-zinc-800" />
                    <Link to="/my-orders" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                      <span aria-hidden="true">📦</span> My orders
                    </Link>
                    {user.role === "admin" && (
                      <Link to="/admin" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30">
                        <span aria-hidden="true">⚙️</span> Admin panel
                      </Link>
                    )}
                    <hr className="my-1 border-zinc-100 dark:border-zinc-800" />
                    <button
                      type="button"
                      onClick={() => { logout(); setUserOpen(false); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                    >
                      <span aria-hidden="true">→</span> Sign out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 dark:text-zinc-50 dark:hover:bg-zinc-800">
                      Sign in
                    </Link>
                    <Link to="/register" className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
                      Create account
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Hamburger — mobile only */}
          <button
            ref={hamburgerRef}
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={drawerRef}
          className="animate-drawer-in border-t border-zinc-200 bg-white/95 px-4 pb-5 pt-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 sm:hidden"
          role="navigation"
          aria-label="Mobile navigation"
        >
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center rounded-2xl px-4 py-3.5 text-base font-medium transition-colors ${
                    active ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {user?.role === "admin" && (
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center rounded-2xl px-4 py-3.5 text-base font-medium text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/30">
                ⚙️ Admin panel
              </Link>
            )}
          </nav>

          <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            {user ? (
              <div className="flex flex-col gap-1">
                <div className="rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{user.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                </div>
                <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800">
                  📦 My orders
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  → Sign out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="flex flex-1 items-center justify-center rounded-2xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-800">
                  Sign in
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="flex flex-1 items-center justify-center rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-200 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
              💜 Wishlist {wishlistCount > 0 && <span className="rounded-full bg-fuchsia-100 px-1.5 text-xs font-semibold text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300">{wishlistCount}</span>}
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900">
              🛒 Cart {count > 0 && <span className="rounded-full bg-white/20 px-1.5 text-xs font-semibold dark:bg-zinc-900/30">{count}</span>}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
