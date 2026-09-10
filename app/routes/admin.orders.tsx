import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.orders";
import type { AdminOrderRow } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Orders — Admin — Nova Store" }];
}

const STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<string, string> = {
  confirmed:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  shipped:    "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
  delivered:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  cancelled:  "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    fetch("/api/admin/orders")
      .then((r) => r.json())
      .then((d: { orders: AdminOrderRow[] }) => setOrders(d.orders ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  async function updateStatus(id: number, status: string) {
    setUpdating(id);
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    setUpdating(null);
  }

  const filtered = orders.filter((o) => {
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.full_name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Orders</h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{orders.length} total</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="search"
            placeholder="Search orders…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-full border border-zinc-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:w-64"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-11 rounded-full border border-zinc-300 bg-white px-4 text-sm font-medium outline-none focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                <tr>
                  {["Order", "Customer", "Items", "Total", "Status", "Date", "Update"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">{order.order_number}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-800 dark:text-zinc-200">{order.full_name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{order.email}</p>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                      {order.items_summary ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatPrice(order.total_cents / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[order.status] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 outline-none disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No orders found.</p>
          )}
        </div>
      )}
    </div>
  );
}
