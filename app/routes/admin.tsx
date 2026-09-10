import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import type { Route } from "./+types/admin";
import { useAuth } from "@/components/auth/AuthContext";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Admin — Nova Store" }];
}

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/products", label: "Products", icon: "📦", end: false },
  { to: "/admin/orders", label: "Orders", icon: "🧾", end: false },
];

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/login?redirect=/admin", { replace: true }); return; }
    if (user.role !== "admin") { navigate("/", { replace: true }); }
  }, [user, loading, navigate]);

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:block">
        <div className="flex h-14 items-center gap-2.5 border-b border-zinc-200 px-5 dark:border-zinc-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-xs font-bold text-white">N</span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Admin</span>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                }`
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 w-56 px-3">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            ← Back to store
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="fixed bottom-0 inset-x-0 z-50 flex border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-medium transition-colors ${
                isActive ? "text-violet-600 dark:text-violet-400" : "text-zinc-500 dark:text-zinc-400"
              }`
            }
          >
            <span className="text-lg" aria-hidden="true">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <main className="min-w-0 flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
