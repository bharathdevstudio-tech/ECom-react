import type { Route } from "./+types/sitemap";
import { getAllProducts, getCategories } from "@/server/db";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// GET /sitemap.xml — a crawler-friendly index of every public URL.
export async function loader({ request }: Route.LoaderArgs) {
  const origin = new URL(request.url).origin;
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const today = new Date().toISOString().slice(0, 10);

  const staticPaths = [
    "/",
    "/products",
    "/order-lookup",
    "/about",
    "/contact",
    "/faq",
    "/shipping-returns",
    "/privacy",
    "/terms",
  ];

  const urls: { loc: string; changefreq: string; priority: string }[] = [
    ...staticPaths.map((path) => ({
      loc: `${origin}${path}`,
      changefreq: path === "/" || path === "/products" ? "daily" : "monthly",
      priority: path === "/" ? "1.0" : path === "/products" ? "0.9" : "0.5",
    })),
    ...categories.map((category) => ({
      loc: `${origin}/products?category=${encodeURIComponent(category)}`,
      changefreq: "weekly",
      priority: "0.7",
    })),
    ...products.map((product) => ({
      loc: `${origin}/products/${encodeURIComponent(product.id)}`,
      changefreq: "weekly",
      priority: "0.8",
    })),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
