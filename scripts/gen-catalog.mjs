// Downloads the verified real product photos from the image cache into
// public/products/real/, generates per-category scene-SVG fallbacks, and
// writes src/server/imageMap.ts (the image pool seed.ts uses to assign
// each product a photo). Fully offline-safe after the first run.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));
const cachePath = new URL("./image-cache.json", import.meta.url);
const realDir = path.join(root, "public", "products", "real");
const imageMapPath = path.join(root, "src", "server", "imageMap.ts");

const categoryArt = {
  Audio: { emoji: "🎧", from: "violet-500", to: "indigo-600", hexA: "#8b5cf6", hexB: "#4f46e5" },
  Wearables: { emoji: "⌚", from: "sky-500", to: "cyan-400", hexA: "#0ea5e9", hexB: "#22d3ee" },
  Accessories: { emoji: "⌨️", from: "fuchsia-500", to: "pink-500", hexA: "#d946ef", hexB: "#ec4899" },
  Tablets: { emoji: "📚", from: "teal-600", to: "emerald-600", hexA: "#0d9488", hexB: "#059669" },
  Drones: { emoji: "🚁", from: "blue-600", to: "indigo-500", hexA: "#2563eb", hexB: "#6366f1" },
  Home: { emoji: "💡", from: "yellow-500", to: "amber-600", hexA: "#eab308", hexB: "#d97706" },
  Cameras: { emoji: "📸", from: "slate-700", to: "zinc-900", hexA: "#334155", hexB: "#18181b" },
};

function escapeXml(value) {
  return value.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);
}

function sceneSvg(category) {
  const art = categoryArt[category] ?? categoryArt.Cameras;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${art.hexA}"/>
      <stop offset="1" stop-color="${art.hexB}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.45" r="0.55">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <rect width="800" height="600" fill="url(#glow)"/>
  <circle cx="660" cy="90" r="150" fill="rgba(255,255,255,0.12)"/>
  <circle cx="110" cy="530" r="210" fill="rgba(0,0,0,0.14)"/>
  <circle cx="710" cy="480" r="90" fill="rgba(255,255,255,0.10)"/>
  <g transform="translate(400,300) scale(1) translate(-95,-95)">
    <rect x="0" y="0" width="190" height="190" rx="42" fill="#ffffff" fill-opacity="0.92"/>
    <text x="95" y="138" font-size="112" text-anchor="middle">${escapeXml(art.emoji)}</text>
  </g>
  <text x="400" y="540" font-size="22" letter-spacing="6" text-anchor="middle" fill="#ffffff" fill-opacity="0.9" font-family="Arial, sans-serif">${escapeXml(category.toUpperCase())}</text>
</svg>`;
}

async function download(url, dest) {
  if (existsSync(dest)) return "cached";
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return "failed";
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    return "downloaded";
  } catch {
    return "failed";
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  let cache = [];
  try {
    cache = JSON.parse(readFileSync(fileURLToPath(cachePath), "utf8"));
  } catch {
    // No verified photos — everything falls back to scene SVGs.
  }

  mkdirSync(realDir, { recursive: true });

  const byCategory = {};
  for (const entry of cache) {
    (byCategory[entry.category] ??= []).push(entry);
  }

  // 1. Download real photos (skipping files we already have).
  const jobs = [];
  for (const category of Object.keys(byCategory)) {
    const list = byCategory[category];
    for (let n = 0; n < list.length; n++) {
      const file = path.join(realDir, `${slugify(category)}-${n}.jpg`);
      jobs.push(download(list[n].url, file).then((status) => console.log(`${status.padEnd(10)} ${list[n].id}`)));
    }
  }
  for (let i = 0; i < jobs.length; i += 6) {
    await Promise.all(jobs.slice(i, i + 6));
  }

  // 2. Build image pools from files actually on disk (so failures drop out).
  const realFiles = readdirSync(realDir).filter((f) => f.endsWith(".jpg"));
  const pools = {};
  for (const category of Object.keys(categoryArt)) {
    const prefix = `${slugify(category)}-`;
    const files = realFiles
      .filter((f) => f.startsWith(prefix))
      .sort()
      .map((f) => `/products/real/${f}`);
    pools[category] = files;
  }

  // 3. Write per-category fallback scene SVGs (used if a pool is empty).
  for (const category of Object.keys(categoryArt)) {
    const file = path.join(root, "public", "products", `fallback-${slugify(category)}.svg`);
    writeFileSync(file, sceneSvg(category));
  }

  // 4. Emit the image map for seed.ts.
  const mapEntries = Object.keys(categoryArt).map((category) => {
    const list = pools[category];
    const fallback = `/products/fallback-${slugify(category)}.svg`;
    const body = list.length
      ? JSON.stringify(list)
      : `[] /* fallback: "${fallback}" */`;
    return `  "${category}": ${body},`;
  });

  writeFileSync(
    imageMapPath,
    `// AUTO-GENERATED by scripts/gen-catalog.mjs — do not edit by hand.\n` +
      `export const categoryImagePool: Record<string, string[]> = {\n${mapEntries.join("\n")}\n};\n`,
  );

  const total = Object.values(pools).reduce((sum, list) => sum + list.length, 0);
  console.log(`\nReal photos on disk: ${total} (${jobs.length} attempted)`);
  for (const category of Object.keys(categoryArt)) {
    console.log(`  ${category}: ${pools[category].length}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});