import { useState } from "react";
import { data, Link } from "react-router";
import type { Route } from "./+types/pages.$slug";

type PageSection = {
  heading: string;
  body: string[];
  bullets?: string[];
};

type PageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: PageSection[];
  faq?: boolean;
};

const pages: Record<string, PageContent> = {
  about: {
    eyebrow: "Our story",
    title: "Gear that earns its place",
    intro:
      "Nova Store is a small, independent shop for people who care about how their tech feels and works. We stock a tight edit of audio, wearables, cameras and smart-home gear — chosen for build quality, not shelf space.",
    sections: [
      {
        heading: "Why we keep the catalog small",
        body: [
          "There is no shortage of gadgets. There is a shortage of well-made ones at a fair price. Every product on Nova is picked by our team, tested in daily use, and kept in the catalog only while it deserves to be there.",
          "That means fewer, better choices — and honest listings with the specs that actually matter.",
        ],
      },
      {
        heading: "What we stand behind",
        body: [],
        bullets: [
          "Genuine products from authorised distributors",
          "30-day returns, no restocking fees",
          "2-year warranty on every item we sell",
          "Real people answering support messages",
        ],
      },
      {
        heading: "Where we are going",
        body: [
          "We are building Nova as a demonstration of a modern storefront: fast pages, clear pricing, transparent stock, and an experience that works just as well on a phone as on a desktop.",
        ],
      },
    ],
  },
  contact: {
    eyebrow: "Support",
    title: "Talk to a human",
    intro:
      "Questions about an order, a product, or a return? Send us a message and we will get back to you within one business day.",
    sections: [
      {
        heading: "Other ways to reach us",
        body: [
          "Email: support@novastore.example",
          "Hours: Monday to Friday, 9am – 6pm (Pacific)",
          "Order updates: use the order lookup page with your order number and checkout email.",
        ],
      },
    ],
  },
  faq: {
    eyebrow: "Help center",
    title: "Frequently asked questions",
    intro: "The quick answers to the things customers ask us most.",
    faq: true,
    sections: [
      {
        heading: "How long does delivery take?",
        body: [
          "Orders placed before 2pm are packed the same business day. Standard delivery takes 3–5 business days. You will see the status of your order on the My Orders page, or with guest order lookup.",
        ],
      },
      {
        heading: "Is shipping really free?",
        body: [
          "Shipping is free on orders of $100 or more. Below that, a flat $12 shipping fee applies. The exact total is always shown before you place the order.",
        ],
      },
      {
        heading: "Can I cancel an order?",
        body: [
          "Yes — while an order is confirmed or being processed, open My Orders and choose Cancel order. We put the items back into stock immediately. Once an order has shipped, it can no longer be cancelled.",
        ],
      },
      {
        heading: "How do returns work?",
        body: [
          "You have 30 days from delivery to return an item in its original condition. Start by contacting support with your order number, and we will send a return label and instructions.",
        ],
      },
      {
        heading: "Do you take real payments?",
        body: [
          "Nova is a demo storefront. You can choose cash on delivery, card, or UPI at checkout, but no real payment is captured and no card details are stored.",
        ],
      },
      {
        heading: "Are the product photos accurate?",
        body: [
          "We use representative photography for the demo catalog. The product name, specifications, and price shown are the source of truth for what you are buying.",
        ],
      },
    ],
  },
  "shipping-returns": {
    eyebrow: "Policies",
    title: "Shipping & returns",
    intro:
      "Fast, tracked delivery and a straightforward returns process — no fine-print surprises.",
    sections: [
      {
        heading: "Shipping",
        body: [],
        bullets: [
          "Free standard shipping on orders over $100",
          "Flat $12 shipping under $100",
          "Orders ship within one business day",
          "Delivery in 3–5 business days",
          "Tracking details appear on My Orders after dispatch",
        ],
      },
      {
        heading: "Returns",
        body: [
          "Changed your mind? You have 30 days from delivery. Items must be unused and in their original packaging. Contact support with your order number to start a return.",
          "Once we receive the item, refunds are issued to the original payment method within 3–5 business days. Original shipping fees are refunded when the return is due to a fault on our side.",
        ],
      },
      {
        heading: "Warranty",
        body: [
          "Every product includes a 2-year warranty covering manufacturing defects. Accidental damage is not covered, but we can usually point you to a repair option.",
        ],
      },
      {
        heading: "Damaged or wrong item",
        body: [
          "If something arrives damaged or is not what you ordered, contact us within 48 hours with a photo. We will arrange a replacement or a full refund, including return shipping.",
        ],
      },
    ],
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy policy",
    intro:
      "We collect the minimum information needed to run the store, and we do not sell it.",
    sections: [
      {
        heading: "What we collect",
        body: [],
        bullets: [
          "Account details: name, email address, and a securely hashed password",
          "Order details: shipping address, phone number, and purchase history",
          "Saved addresses you choose to keep in your account",
          "Support messages you send us",
          "A session cookie used to keep your cart and sign-in state",
        ],
      },
      {
        heading: "How we use it",
        body: [
          "We use your information to process orders, provide support, prevent fraud, and improve the store. We do not sell or rent personal information.",
          "Order and account data are stored in a Cloudflare D1 database. Passwords are salted and hashed; we never store them in plain text.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "You can update your name and email, change your password, and delete saved addresses from your profile at any time. Contact support to request a copy of your data or deletion of your account.",
        ],
      },
      {
        heading: "Cookies",
        body: [
          "We use a single first-party session cookie. It is required for the cart, wishlist, and sign-in to work. We do not use advertising or cross-site tracking cookies.",
        ],
      },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms of sale",
    intro:
      "The rules that apply when you browse or buy from Nova Store.",
    sections: [
      {
        heading: "Orders and pricing",
        body: [
          "All prices are shown in US dollars and include applicable discounts but exclude tax, which is calculated at checkout. We reserve the right to cancel an order if a product is mispriced or unavailable, and will refund any amount already paid.",
          "Placing an order confirms that the details you provide are accurate and that you are authorised to use the selected payment method.",
        ],
      },
      {
        heading: "Payment",
        body: [
          "This is a demonstration store. No real payment is processed and no card details are collected. The payment method you select is recorded with the order for display purposes only.",
        ],
      },
      {
        heading: "Shipping and risk",
        body: [
          "Risk passes to you on delivery. Please inspect the parcel on arrival and report damage within 48 hours. Delivery estimates are not guarantees and may be affected by carriers or events outside our control.",
        ],
      },
      {
        heading: "Returns and cancellations",
        body: [
          "The returns policy above forms part of these terms. Orders can be cancelled before dispatch from the My Orders page. After dispatch, use the returns process.",
        ],
      },
      {
        heading: "Acceptable use",
        body: [
          "Do not attempt to disrupt the store, scrape it at scale, or use it for fraudulent activity. Accounts that abuse the service may be suspended.",
        ],
      },
    ],
  },
};

export function meta({ data }: Route.MetaArgs) {
  if (!data?.page) return [{ title: "Page not found — Nova Store" }];
  return [
    { title: `${data.page.title} — Nova Store` },
    { name: "description", content: data.page.intro },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const slug = params.slug ?? "";
  const page = pages[slug] ?? null;
  return data({ page, slug }, { status: page ? 200 : 404 });
}

function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Could not send your message.");
        return;
      }
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-sm text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/40 dark:text-emerald-200">
        <p className="font-semibold">Message sent.</p>
        <p className="mt-1">Thanks for reaching out — we will reply within one business day.</p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 rounded-full border border-emerald-300 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
        >
          Send another message
        </button>
      </div>
    );
  }

  const inputClass =
    "h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500";

  return (
    <form onSubmit={submit} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Send a message</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        We usually reply within one business day.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Your name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Email</span>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Subject</span>
          <input
            required
            minLength={3}
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Order question, product advice, return…"
            className={inputClass}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-zinc-600 dark:text-zinc-300">Message</span>
          <textarea
            required
            minLength={10}
            rows={6}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            placeholder="How can we help?"
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
        </label>
      </div>
      {error && (
        <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={sending}
        className="mt-4 h-11 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-violet-600/20 disabled:cursor-wait disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export default function StaticPage({ loaderData }: Route.ComponentProps) {
  const { page, slug } = loaderData;

  if (!page) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-24 text-center sm:px-6">
        <span className="text-5xl" aria-hidden="true">🧭</span>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Page not found</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          We could not find “{slug}”. Try the help center or head back to the shop.
        </p>
        <div className="mt-2 flex gap-2">
          <Link to="/faq" className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-zinc-50 dark:text-zinc-900">
            Help center
          </Link>
          <Link to="/products" className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200">
            Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
          {page.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          {page.title}
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-500 dark:text-zinc-400">{page.intro}</p>
      </div>

      <div className={`mt-10 grid gap-8 ${slug === "contact" ? "lg:grid-cols-[1fr_1.1fr]" : ""}`}>
        <div className="flex flex-col gap-8">
          {page.sections.map((section) =>
            page.faq ? (
              <details
                key={section.heading}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-zinc-900 dark:text-zinc-50">
                  {section.heading}
                  <span className="text-zinc-400 transition-transform group-open:rotate-45" aria-hidden="true">＋</span>
                </summary>
                <div className="mt-3 flex flex-col gap-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                </div>
              </details>
            ) : (
              <section key={section.heading}>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{section.heading}</h2>
                <div className="mt-2 flex flex-col gap-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.bullets && (
                    <ul className="mt-1 flex flex-col gap-2">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-0.5 text-violet-600 dark:text-violet-400" aria-hidden="true">✓</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ),
          )}
        </div>

        {slug === "contact" && (
          <div>
            <ContactForm />
            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
              <p className="font-semibold text-zinc-900 dark:text-zinc-50">Looking for an order?</p>
              <p className="mt-1">
                Check <Link to="/my-orders" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">My Orders</Link>{" "}
                if you are signed in, or use{" "}
                <Link to="/order-lookup" className="font-medium text-violet-600 hover:text-violet-700 dark:text-violet-400">guest order lookup</Link>{" "}
                with your order number and email.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">More help</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { to: "/faq", label: "FAQ" },
            { to: "/shipping-returns", label: "Shipping & returns" },
            { to: "/about", label: "About us" },
            { to: "/contact", label: "Contact" },
            { to: "/privacy", label: "Privacy" },
            { to: "/terms", label: "Terms" },
          ]
            .filter((link) => link.to !== `/${slug}`)
            .map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-violet-400 hover:text-violet-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-violet-500 dark:hover:text-violet-300"
              >
                {link.label}
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
}
