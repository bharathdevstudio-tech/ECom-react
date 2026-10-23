import { useEffect, useState } from "react";
import type { Route } from "./+types/admin.coupons";
import type { Coupon, CouponType } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [{ title: "Coupons — Admin — Nova Store" }];
}

type FormState = {
  code: string;
  type: CouponType;
  value: string;
  minSubtotal: string;
  maxUses: string;
  expiresAt: string;
};

const EMPTY_FORM: FormState = {
  code: "",
  type: "percent",
  value: "10",
  minSubtotal: "0",
  maxUses: "",
  expiresAt: "",
};

function couponValueLabel(coupon: Coupon): string {
  return coupon.type === "percent"
    ? `${coupon.value}% off`
    : `$${(coupon.value / 100).toFixed(2)} off`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchCoupons = () => {
    setLoading(true);
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((d: { coupons: Coupon[] }) => setCoupons(d.coupons ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setError(null);
    setNotice(null);

    const value = Number(form.value);
    if (!form.code.trim()) {
      setError("Enter a coupon code.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a discount greater than zero.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          type: form.type,
          value: form.type === "fixed" ? Math.round(value * 100) : Math.round(value),
          minSubtotal: Number(form.minSubtotal) || 0,
          maxUses: form.maxUses.trim() ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt.trim() ? `${form.expiresAt.trim()}T23:59:59` : null,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; coupon?: Coupon };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not create coupon.");
        return;
      }
      setNotice(`Coupon ${data.coupon?.code ?? ""} created.`);
      setForm(EMPTY_FORM);
      fetchCoupons();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon: Coupon) {
    setBusyCode(coupon.code);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon.code, active: !coupon.active }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not update coupon.");
        return;
      }
      fetchCoupons();
    } catch {
      setError("Network error.");
    } finally {
      setBusyCode(null);
    }
  }

  async function removeCoupon(coupon: Coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}? This cannot be undone.`)) return;
    setBusyCode(coupon.code);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(coupon.code)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not delete coupon.");
        return;
      }
      fetchCoupons();
    } catch {
      setError("Network error.");
    } finally {
      setBusyCode(null);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Marketing
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Coupons
        </h1>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {coupons.length} total · validated on the server at checkout
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✓ {notice}
        </div>
      )}

      {/* Create form */}
      <form
        onSubmit={handleCreate}
        className="mb-8 rounded-2xl border border-violet-200 bg-violet-50/50 p-5 dark:border-violet-800/50 dark:bg-violet-950/20 sm:p-6"
      >
        <h2 className="mb-5 font-bold text-zinc-900 dark:text-zinc-50">Create a coupon</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Code *
            </span>
            <input
              required
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="WELCOME10"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 font-mono text-sm uppercase outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Type *
            </span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CouponType }))}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              {form.type === "percent" ? "Percent off *" : "Amount off ($) *"}
            </span>
            <input
              required
              type="number"
              min="0.01"
              step={form.type === "percent" ? "1" : "0.01"}
              max={form.type === "percent" ? "100" : undefined}
              value={form.value}
              onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Minimum subtotal ($)
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.minSubtotal}
              onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Max uses (blank = unlimited)
            </span>
            <input
              type="number"
              min="1"
              step="1"
              value={form.maxUses}
              onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
              placeholder="Unlimited"
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Expires (blank = never)
            </span>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-transform hover:scale-[1.02] disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Creating…" : "+ Create coupon"}
        </button>
      </form>

      {/* Coupon table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
          <span className="text-4xl" aria-hidden="true">🎟️</span>
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            No coupons yet. Create one above.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Discount</th>
                <th className="px-4 py-3 font-semibold">Min. spend</th>
                <th className="px-4 py-3 font-semibold">Uses</th>
                <th className="px-4 py-3 font-semibold">Expires</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {coupons.map((coupon) => (
                <tr key={coupon.code} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-4 py-3 font-mono font-semibold text-zinc-900 dark:text-zinc-50">
                    {coupon.code}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-200">
                    {couponValueLabel(coupon)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">
                    {coupon.minSubtotalCents > 0 ? `$${(coupon.minSubtotalCents / 100).toFixed(2)}` : "—"}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-300">
                    {coupon.uses}
                    {coupon.maxUses != null ? ` / ${coupon.maxUses}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        coupon.active
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {coupon.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(coupon)}
                        disabled={busyCode === coupon.code}
                        className="rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
                      >
                        {coupon.active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCoupon(coupon)}
                        disabled={busyCode === coupon.code}
                        className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-800/50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
