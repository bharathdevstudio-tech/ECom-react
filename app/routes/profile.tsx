import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/profile";
import { useAuth } from "@/components/auth/AuthContext";
import AddressBook from "@/components/account/AddressBook";
import { formatPrice } from "@/lib/format";
import type { UserProfile } from "@/lib/types";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "My profile — Nova Store" },
    { name: "description", content: "Manage your Nova Store account details and password." },
  ];
}

const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:bg-zinc-100 disabled:text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:disabled:bg-zinc-900 dark:disabled:text-zinc-400";

const labelClass = "mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300";

export default function ProfilePage() {
  const { user, loading: authLoading, updateUser } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile details form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileOk, setProfileOk] = useState<string | null>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordOk, setPasswordOk] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login?redirect=/profile", { replace: true });
      return;
    }
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d: { profile?: UserProfile; error?: string }) => {
        if (d.profile) {
          setProfile(d.profile);
          setName(d.profile.name);
          setEmail(d.profile.email);
        }
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, navigate]);

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingProfile) return;
    setProfileError(null);
    setProfileOk(null);

    if (!name.trim()) {
      setProfileError("Name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const data = (await res.json()) as { ok?: boolean; user?: UserProfile; error?: string };
      if (!res.ok || !data.ok || !data.user) {
        setProfileError(data.error ?? "Could not update your profile.");
        return;
      }
      updateUser(data.user);
      setProfile((prev) => (prev ? { ...prev, ...data.user! } : prev));
      setName(data.user.name);
      setEmail(data.user.email);
      setProfileOk("Profile updated.");
    } catch {
      setProfileError("Network error. Try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (savingPassword) return;
    setPasswordError(null);
    setPasswordOk(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setPasswordError(data.error ?? "Could not change your password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordOk("Password changed.");
    } catch {
      setPasswordError("Network error. Try again.");
    } finally {
      setSavingPassword(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          Account
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
          My profile
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Manage your details, password, and see your activity.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Orders", value: String(profile?.stats.orders ?? 0) },
          { label: "Total spent", value: formatPrice((profile?.stats.totalSpentCents ?? 0) / 100) },
          { label: "Reviews", value: String(profile?.stats.reviews ?? 0) },
          { label: "Member since", value: memberSince },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {stat.label}
            </p>
            <p className="mt-1 truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile details */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Profile details</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            This is how your name appears on reviews.
          </p>

          <form onSubmit={saveProfile} className="mt-5 flex flex-col gap-4">
            <label className="block">
              <span className={labelClass}>Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                autoComplete="name"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                autoComplete="email"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Role</span>
              <input
                value={user?.role === "admin" ? "Administrator" : "Customer"}
                readOnly
                disabled
                className={`${inputClass} capitalize`}
              />
            </label>

            {profileError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
                {profileError}
              </p>
            )}
            {profileOk && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                {profileOk}
              </p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="h-11 w-full rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 transition-all hover:shadow-xl disabled:cursor-wait disabled:opacity-60 sm:w-auto sm:self-start"
            >
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Change password</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Use at least 8 characters.
          </p>

          <form onSubmit={savePassword} className="mt-5 flex flex-col gap-4">
            <label className="block">
              <span className={labelClass}>Current password</span>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>New password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Confirm new password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={inputClass}
              />
            </label>

            {passwordError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
                {passwordError}
              </p>
            )}
            {passwordOk && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                {passwordOk}
              </p>
            )}

            <button
              type="submit"
              disabled={savingPassword}
              className="h-11 w-full rounded-full border border-zinc-300 px-6 text-sm font-semibold text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300 sm:w-auto sm:self-start"
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>
      </div>

      <div className="mt-6">
        <AddressBook />
      </div>

      {/* Quick links */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/my-orders"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
        >
          📦 My orders
        </Link>
        <Link
          to="/order-lookup"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-300 px-5 text-sm font-medium text-zinc-700 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-violet-500 dark:hover:text-violet-300"
        >
          🔎 Track an order
        </Link>
      </div>
    </div>
  );
}
