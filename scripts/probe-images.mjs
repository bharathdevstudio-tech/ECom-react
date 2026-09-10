// Probes a curated list of Unsplash CDN product-photo URLs, keeps only the
// ones that actually return a valid image, and caches the result to
// scripts/image-cache.json so the catalog generator stays repeatable/offline-safe.

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const candidates = {
  Audio: [
    "1505740420928-5e560c06d30e", // black wireless headphones (classic)
    "1484704849700-f032a568e944", // headset on pink
    "1618384887929-16ec33fab9ef", // over-ear headphones
    "1572569511254-d8f925fe2cbb", // headphones in hand
    "1583394838336-acd977736f90", // white headphones
    "1590658268037-6bf12165a8df", // wireless earbuds
    "1608159066555-3b1f5c2c0b00", // earbuds case
    "1545454675-3531b543be5d", // gray speaker on table
    "1580910051074-3eb694886505", // smart speaker glowing ring
    "1608043152269-423dbba4e7e1", // cube speaker
    "1589003077984-894e133dabab", // portable speaker
    "1613040809024-b4ef7ba99bc3", // earbuds in case
    "1518604664576-749b7168faf8", // music / turntable gear
    "1520523839897-2e8775e79f4f", // audio setup
  ],
  Wearables: [
    "1523275335684-37898b6baf30", // minimalist watch product shot
    "1524805444758-089113d48a6d", // wristwatch on wood
    "1524592094714-0f0654e20314", // watch on color backdrop
    "1508685096489-7aacd43bd3b1", // watch + phone flatlay
    "1575311373937-040b8e1fd5b6", // apple watch
    "1544117519-31a4b719223d", // analog watch product
    "1609174550140-c35b7d2dc7e0", // smart ring
  ],
  "Accessories": [
    "1587829741301-dc798b83add3", // RGB mechanical keyboard
    "1527814050087-3793815479db", // computer mouse
    "1583863788434-e58a36330cf0", // usb drive
    "1596492784531-6e6eb5ea9993", // cables on yellow
    "1618410320928-25228d811631", // chargers and cables
    "1519389950473-47ba0277781c", // keyboard + laptop dark
    "1601448464201-9e57d4851ef5", // keyboard close-up
    "1551462147-ff29053c4754", // desk setup
  ],
  Cameras: [
    "1526170375885-4d8ecf77b99f", // black camera on gray
    "1516035069371-29a1b244cc32", // DSLR on workbench
    "1502920917128-1aa500764cbd", // camera on desk
    "1542038784456-1ea8e935640e", // camera gear on green
    "1554080353-a576cf803bda", // camera product
    "1510127038375-0d5a26a72e9b", // camera gear
  ],
  Drones: [
    "1473968512647-3e447244af8f", // drone flying in sky
    "1527977966376-1c8408f9f108", // action camera
    "1526947425960-945c6e72858f", // drone controller
    "1571351977654-c2076c870ad4", // drone flying
  ],
  Tablets: [
    "1544716278-ca5e3f4abd8c", // open book reading
    "1585790050230-5dd28404ccb9", // tablet on desk
    "1517336714731-489689fd1ca8", // laptop desk (tech)
    "1531297484001-80022131f5a1", // laptop dark desk
    "1544244017-807bdaf0a368", // cracked screen / tablet repair
    "1512941937669-90a1b58e7e9c", // tablet held
  ],
  Home: [
    "1507473885765-e6ed057f782c", // desk lamp
    "1513506003901-1e6a229e2d15", // light bulb
    "1550989460-0adf9ea622e2", // lamp on desk
    "1555041469-a586c61ea9bc", // sofa living room
    "1517705008128-361805f42e86", // cozy interior
  ],
};

const results = [];

async function probe(category, id) {
  const url = `https://images.unsplash.com/photo-${id}?w=900&h=900&fit=crop&q=70&fm=jpg`;
  try {
    const res = await fetch(url, { method: "GET", headers: { "accept-encoding": "identity" } });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    if (!type.startsWith("image/")) return false;
    const length = res.headers.get("content-length");
    res.body?.cancel();
    return { category, id, type, length, url };
  } catch {
    return false;
  }
}

async function main() {
  const batchSize = 8;
  const all = [];
  for (const category of Object.keys(candidates)) {
    for (const id of candidates[category]) {
      all.push({ category, id });
    }
  }

  let valid = [];
  for (let i = 0; i < all.length; i += batchSize) {
    const slice = all.slice(i, i + batchSize);
    const settled = await Promise.all(slice.map((c) => probe(c.category, c.id)));
    for (const r of settled) {
      if (r) {
        valid.push(r);
        results.push(`OK   ${r.category.padEnd(12)} photo-${r.id} (${r.type}, ${r.length ?? "?"} bytes)`);
      } else {
        // figure out which one failed
      }
    }
  }

  // Report failures too
  const okIds = new Set(valid.map((v) => v.id));
  const failed = all.filter((c) => !okIds.has(c.id));
  for (const c of failed) {
    results.push(`FAIL ${c.category.padEnd(12)} photo-${c.id}`);
  }

  if (valid.length > 0) {
    writeFileSync(
      fileURLToPath(new URL("./image-cache.json", import.meta.url)),
      JSON.stringify(valid, null, 2),
    );
  }

  console.log(`Valid: ${valid.length} / ${all.length}`);
  console.log(results.sort().join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});