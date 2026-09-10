// Generates product images (SVG) into public/products/ from the seed catalog.
// Run: node scripts/generate-images.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)).replace(/scripts$/, "");
const outDir = path.join(root, "public", "products");
mkdirSync(outDir, { recursive: true });

const colorMap = {
  "violet-500": "#8b5cf6",
  "indigo-600": "#4f46e5",
  "sky-500": "#0ea5e9",
  "cyan-400": "#22d3ee",
  "fuchsia-500": "#d946ef",
  "pink-500": "#ec4899",
  "amber-500": "#f59e0b",
  "orange-500": "#f97316",
  "emerald-500": "#10b981",
  "teal-500": "#14b8a6",
  "slate-500": "#64748b",
  "slate-700": "#334155",
  "red-500": "#ef4444",
  "rose-600": "#e11d48",
  "teal-600": "#0d9488",
  "emerald-600": "#059669",
  "blue-600": "#2563eb",
  "indigo-500": "#6366f1",
  "yellow-500": "#eab308",
  "amber-600": "#d97706",
  "zinc-900": "#18181b",
  "lime-500": "#84cc16",
  "green-600": "#16a34a",
};

function hex(color) {
  return colorMap[color] ?? "#6366f1";
}

function parseGradient(gradient) {
  const match = /^from-([\w-]+) to-([\w-]+)$/.exec(gradient);
  if (!match) return ["#6366f1", "#4f46e5"];
  return [hex(match[1]), hex(match[2])];
}

function decor() {
  return `
  <circle cx="660" cy="90" r="150" fill="rgba(255,255,255,0.10)"/>
  <circle cx="120" cy="520" r="200" fill="rgba(0,0,0,0.12)"/>
  <circle cx="700" cy="480" r="90" fill="rgba(255,255,255,0.08)"/>`;
}

const products = [
  { id: "aurora-headphones", emoji: "🎧", gradient: "from-violet-500 to-indigo-600", name: "Aurora Headphones" },
  { id: "pulse-smartwatch", emoji: "⌚", gradient: "from-sky-500 to-cyan-400", name: "Pulse Smartwatch S2" },
  { id: "neon-mechanical-keyboard", emoji: "⌨️", gradient: "from-fuchsia-500 to-pink-500", name: "Neon Keyboard" },
  { id: "stellar-webcam", emoji: "📷", gradient: "from-amber-500 to-orange-500", name: "Stellar 4K Webcam" },
  { id: "volt-power-bank", emoji: "🔋", gradient: "from-emerald-500 to-teal-500", name: "Volt 20K Charger" },
  { id: "echo-smart-speaker", emoji: "🔊", gradient: "from-slate-500 to-slate-700", name: "Echo Smart Speaker" },
  { id: "terra-gaming-mouse", emoji: "🖱️", gradient: "from-red-500 to-rose-600", name: "Terra Mouse" },
  { id: "nova-e-reader", emoji: "📚", gradient: "from-teal-600 to-emerald-600", name: "Nova E-Reader" },
  { id: "orbit-drone", emoji: "🚁", gradient: "from-blue-600 to-indigo-500", name: "Orbit Mini Drone" },
  { id: "solstice-desk-lamp", emoji: "💡", gradient: "from-yellow-500 to-amber-600", name: "Solstice Lamp" },
  { id: "canyon-camera", emoji: "📸", gradient: "from-slate-700 to-zinc-900", name: "Canyon Camera" },
  { id: "breeze-portable-speaker", emoji: "🔈", gradient: "from-lime-500 to-green-600", name: "Breeze Speaker" },
];

const W = 800;
const H = 600;

for (const product of products) {
  const [c1, c2] = parseGradient(product.gradient);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${decor()}
  <text x="50%" y="52%" font-size="280" text-anchor="middle" dominant-baseline="central"
        style="font-family:'Segoe UI Emoji','Apple Color Emoji','Noto Color Emoji',sans-serif">${product.emoji}</text>
  <rect x="0" y="${H - 86}" width="${W}" height="86" fill="rgba(0,0,0,0.25)"/>
  <text x="50%" y="${H - 34}" font-size="30" text-anchor="middle" fill="#ffffff"
        style="font-family:'Segoe UI',Arial,sans-serif;letter-spacing:6px;font-weight:600;text-transform:uppercase">${product.name}</text>
</svg>
`;
  const file = path.join(outDir, `${product.id}.svg`);
  writeFileSync(file, svg, "utf8");
  console.log(`✓ ${file}`);
}

console.log(`Generated ${products.length} product images in ${outDir}`);