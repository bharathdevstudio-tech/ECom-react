import { useEffect, useState } from "react";
import type { Address, AddressInput } from "@/lib/types";

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";
const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300";

const emptyForm: AddressInput = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  isDefault: false,
};

function AddressForm({
  initial,
  saving,
  error,
  onCancel,
  onSubmit,
}: {
  initial: AddressInput;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: AddressInput) => void;
}) {
  const [form, setForm] = useState<AddressInput>(initial);
  const set = (key: keyof AddressInput, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="mt-4 rounded-2xl border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900/60 dark:bg-violet-950/20 sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Label</span>
          <input
            value={form.label ?? ""}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Home / Office"
            maxLength={20}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Full name</span>
          <input
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            required
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Phone</span>
          <input
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
            type="tel"
            autoComplete="tel"
            placeholder="+1 555 123 4567"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Country</span>
          <input
            value={form.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
            autoComplete="country-name"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Address line 1</span>
          <input
            value={form.line1}
            onChange={(e) => set("line1", e.target.value)}
            required
            autoComplete="address-line1"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>Address line 2 (optional)</span>
          <input
            value={form.line2 ?? ""}
            onChange={(e) => set("line2", e.target.value)}
            autoComplete="address-line2"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>City</span>
          <input
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            required
            autoComplete="address-level2"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>State</span>
          <input
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            required
            autoComplete="address-level1"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className={labelClass}>ZIP / Postal code</span>
          <input
            value={form.zip}
            onChange={(e) => set("zip", e.target.value)}
            required
            autoComplete="postal-code"
            className={inputClass}
          />
        </label>
        <label className="flex items-end gap-2 pb-2.5 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <input
            type="checkbox"
            checked={form.isDefault ?? false}
            onChange={(e) => set("isDefault", e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
          />
          Use as default address
        </label>
      </div>

      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="h-10 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 disabled:cursor-wait disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save address"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((d: { addresses?: Address[] }) => setAddresses(d.addresses ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function save(input: AddressInput) {
    if (saving) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const isNew = editing === "new";
      const res = await fetch(
        isNew ? "/api/addresses" : `/api/addresses/${editing}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const data = (await res.json()) as { ok?: boolean; address?: Address; error?: string };
      if (!res.ok || !data.ok || !data.address) {
        setError(data.error ?? "Could not save this address.");
        return;
      }
      setEditing(null);
      setNotice(isNew ? "Address added." : "Address updated.");
      const list = await fetch("/api/addresses").then((r) => r.json()) as { addresses?: Address[] };
      setAddresses(list.addresses ?? []);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(address: Address) {
    if (!window.confirm(`Delete the “${address.label}” address?`)) return;
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not delete this address.");
        return;
      }
      const list = await fetch("/api/addresses").then((r) => r.json()) as { addresses?: Address[] };
      setAddresses(list.addresses ?? []);
      setNotice("Address deleted.");
      if (editing === address.id) setEditing(null);
    } catch {
      setError("Network error. Try again.");
    }
  }

  async function makeDefault(address: Address) {
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/addresses/${address.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = (await res.json()) as { ok?: boolean; addresses?: Address[]; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not set the default address.");
        return;
      }
      setAddresses(data.addresses ?? []);
      setNotice("Default address updated.");
    } catch {
      setError("Network error. Try again.");
    }
  }

  const initialFor = (address: Address): AddressInput => ({
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    zip: address.zip,
    country: address.country,
    isDefault: address.isDefault,
  });

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Saved addresses</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Deliveries can go to any of these addresses.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditing("new"); setError(null); setNotice(null); }}
          className="h-10 rounded-full border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
        >
          + Add address
        </button>
      </div>

      {notice && (
        <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </p>
      )}
      {error && editing === null && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}

      {editing === "new" && (
        <AddressForm
          initial={emptyForm}
          saving={saving}
          error={error}
          onCancel={() => setEditing(null)}
          onSubmit={save}
        />
      )}

      {loading ? (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Loading addresses…</p>
      ) : addresses.length === 0 && editing !== "new" ? (
        <p className="mt-4 rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No saved addresses yet. Add one to speed up checkout.
        </p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {addresses.map((address) =>
            editing === address.id ? (
              <li key={address.id} className="sm:col-span-2">
                <AddressForm
                  initial={initialFor(address)}
                  saving={saving}
                  error={error}
                  onCancel={() => setEditing(null)}
                  onSubmit={save}
                />
              </li>
            ) : (
              <li
                key={address.id}
                className={`rounded-2xl border p-4 text-sm ${
                  address.isDefault
                    ? "border-violet-300 bg-violet-50/50 dark:border-violet-800 dark:bg-violet-950/20"
                    : "border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-50">{address.label}</span>
                  {address.isDefault && (
                    <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                      Default
                    </span>
                  )}
                </div>
                <p className="mt-2 font-medium text-zinc-800 dark:text-zinc-200">{address.fullName}</p>
                <p className="text-zinc-500 dark:text-zinc-400">{address.phone}</p>
                <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  <br />
                  {address.city}, {address.state} {address.zip}
                  <br />
                  {address.country}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => { setEditing(address.id); setError(null); setNotice(null); }}
                    className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => makeDefault(address)}
                      className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50"
                    >
                      Set default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(address)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </section>
  );
}
