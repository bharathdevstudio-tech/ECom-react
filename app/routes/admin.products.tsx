import { useEffect, useRef, useState } from "react";
import type { Route } from "./+types/admin.products";
import type { Product, AdminProductInput } from "@/lib/types";
import { formatPrice } from "@/lib/format";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Products — Admin — Nova Store" }];
}

const GRADIENTS = [
  "from-violet-500 to-indigo-600", "from-sky-500 to-cyan-400",
  "from-fuchsia-500 to-pink-500", "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500", "from-red-500 to-rose-600",
  "from-teal-600 to-emerald-600", "from-blue-600 to-indigo-500",
];

const CATEGORIES = ["Audio", "Wearables", "Accessories", "Tablets", "Drones", "Home", "Cameras"];

type FormState = Omit<AdminProductInput, "features"> & { features: string };

const EMPTY_FORM: FormState = {
  name: "", tagline: "", description: "", price: 0, compareAt: undefined,
  category: "Audio", emoji: "", image: "", stock: 10, featured: false, features: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const fetchProducts = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d: { products: Product[] }) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  function openAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, tagline: p.tagline, description: p.description,
      price: p.price, compareAt: p.compareAt,
      category: p.category, emoji: p.emoji, image: p.image,
      stock: p.stock, featured: p.featured, features: "",
    });
    // fetch features for editing product
    fetch(`/api/admin/products`)
      .then((r) => r.json())
      .then((d: { products: Product[] }) => {
        const found = d.products?.find((x: Product) => x.id === p.id);
        if (found) setForm((prev) => ({ ...prev }));
      });
    setError(null);
    setShowForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function handleSave() {
    if (!form.name || !form.category || form.price <= 0) {
      setError("Name, category, and a valid price are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const input: AdminProductInput = {
      ...form,
      features: form.features ? form.features.split("\n").map((s) => s.trim()).filter(Boolean) : [],
    };

    try {
      const res = editing
        ? await fetch(`/api/admin/products/${editing.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          })
        : await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });

      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) { setError(data.error ?? "Save failed"); return; }
      setShowForm(false);
      fetchProducts();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleteId(null);
      fetchProducts();
    }
  }

  const filtered = products.filter(
    (p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">Admin</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Products</h1>
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{products.length} total</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02]"
        >
          + Add product
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div ref={formRef} className="mb-8 rounded-2xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-800/50 dark:bg-violet-950/20 sm:p-6">
          <h2 className="mb-5 font-bold text-zinc-900 dark:text-zinc-50">
            {editing ? `Edit: ${editing.name}` : "Add new product"}
          </h2>

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">⚠️ {error}</div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { key: "name", label: "Product name *", placeholder: "Aurora Headphones" },
              { key: "tagline", label: "Tagline *", placeholder: "Short selling line" },
            ].map(({ key, label, placeholder }) => (
              <label key={key} className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
                <input
                  type="text"
                  required
                  placeholder={placeholder}
                  value={(form as Record<string, unknown>)[key] as string}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </label>
            ))}

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Description *</span>
              <textarea
                required
                rows={3}
                placeholder="Full product description…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Price ($) *</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Compare-at price ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.compareAt || ""}
                onChange={(e) => setForm((f) => ({ ...f, compareAt: parseFloat(e.target.value) || undefined }))}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Category *</span>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Stock</span>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: parseInt(e.target.value) || 0 }))}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Emoji</span>
              <input
                type="text"
                placeholder="📦"
                value={form.emoji}
                onChange={(e) => setForm((f) => ({ ...f, emoji: e.target.value }))}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Image URL</span>
              <input
                type="text"
                placeholder="/products/real/audio-0.jpg"
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">Features (one per line)</span>
              <textarea
                rows={4}
                placeholder={"40-hour battery life\nBluetooth 5.3\nUSB-C charging"}
                value={form.features}
                onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </label>

            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                id="featured-toggle"
                type="checkbox"
                checked={form.featured}
                onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
                className="h-4 w-4 rounded accent-violet-600"
              />
              <label htmlFor="featured-toggle" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Mark as featured (shown on homepage)
              </label>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
            >
              {saving ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Saving…</> : (editing ? "Save changes" : "Create product")}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex h-11 items-center rounded-full border border-zinc-300 px-6 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 relative">
        <svg className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-full border border-zinc-300 bg-white pl-10 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 sm:max-w-xs"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                <tr>
                  {["Product", "Category", "Price", "Stock", "Featured", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 shrink-0 overflow-hidden rounded-lg ${p.image ? "" : `bg-gradient-to-br ${p.gradient} flex items-center justify-center text-base`}`}>
                          {p.image
                            ? <img src={p.image} alt="" className="h-full w-full object-cover" />
                            : <span aria-hidden="true">{p.emoji}</span>
                          }
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-zinc-50 line-clamp-1">{p.name}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">{p.tagline}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{p.category}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{formatPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold tabular-nums ${p.stock === 0 ? "text-red-600" : p.stock < 10 ? "text-amber-600" : "text-zinc-900 dark:text-zinc-50"}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.featured
                        ? <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-950/50 dark:text-violet-300">Yes</span>
                        : <span className="text-zinc-400 dark:text-zinc-500">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          Edit
                        </button>
                        {deleteId === p.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDelete(p.id)}
                              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteId(null)}
                              className="rounded-lg border border-zinc-200 px-2 py-1.5 text-xs dark:border-zinc-700"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteId(p.id)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No products found.</p>
          )}
        </div>
      )}
    </div>
  );
}
