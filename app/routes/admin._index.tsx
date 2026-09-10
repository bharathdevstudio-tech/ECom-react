import { useEffect, useState } from "react";
import { Link } from "react-router";
import type { Route } from "./+types/admin._index";
import { formatPrice } from "@/lib/format";
import type { AdminOrderRow } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Dashboard — Admin — Nova Store" }];
}

type Stats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
  totalUsers: number;
  recentOrders: AdminOrderRow[];
};

const STATUS_STYLES: Record<string, string> = {
  confirmed:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  shipped:    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  delivered:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled:  "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d: Stats) => setStats(d));
  }, []);

  const cards = stats
    ? [
        { label: "Total products", value: stats.totalProducts.toLocaleString(), icon: "📦", color: "from-violet-500 to-indigo-600" },
        { label: "Total orders", value: stats.totalOrders.toLocaleString(), icon: "🧾", color: "from-sky-500 to-cyan-500" },
        { label: "Total revenue", value: formatPrice(stats.totalRevenueCents / 100), icon: "💰", color: "from-emerald-500 to-teal-500" },
        { label: "Registered users", value: stats.totalUsers.toLocaleString(), icon: "👤", color: "from-fuchsia-500 to-pink-500" },
      ]
    : [];

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-2xl" />
            ))
          : cards.map((card) => (
              <div key={card.label} className={`flex flex-col gap-3 rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white shadow-lg`}>
                <span className="text-2xl" aria-hidden="true">{card.icon}</span>
                <div>
                  <p className="text-xs font-medium opacity-80">{card.label}</p>
                  <p className="mt-0.5 text-2xl font-extrabold tabular-nums">{card.value}</p>
                </div>
              </div>
            ))}
      </div>

      {/* Recent orders */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">
            View all →
          </Link>
        </div>

        {stats === null ? (
          <div className="skeleton h-48 rounded-2xl" />
        ) : stats.recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No orders yet.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <tr>
                    {["Order", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                      <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-50">{order.order_number}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{order.full_name}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-zinc-500 dark:text-zinc-400">{order.items_summary}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{formatPrice(order.total_cents / 100)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-400 dark:text-zinc-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
