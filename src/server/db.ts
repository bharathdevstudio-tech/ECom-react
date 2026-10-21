import type {
  CartItem,
  OrderConfirmation,
  OrderInput,
  Product,
  Review,
  SortKey,
  User,
  AdminOrderRow,
  AdminProductInput,
} from "@/lib/types";
import { seedProducts, seedCategories, seedReviewsFor } from "@/server/seed";

// ─────────────────────────────────────────────────────────────────────────────
// Storage layer with two interchangeable backends:
//
//   • Cloudflare Workers → D1 (SQLite over the `DB` binding)
//   • Node.js (local dev) → node:sqlite file in ./data/nova.db
//
// Every exported function is async so both backends share the same API.
// Node-only modules are imported dynamically, so the Workers bundle never
// touches `node:sqlite` / `node:fs` (they are unavailable on Workers).
// ─────────────────────────────────────────────────────────────────────────────

type SqlParam = string | number | null;
type Row = Record<string, any>;

type RunResult = { changes: number; lastInsertRowid: number };

interface Backend {
  readonly kind: "d1" | "sqlite";
  all<T = Row>(sql: string, params?: SqlParam[]): Promise<T[]>;
  get<T = Row>(sql: string, params?: SqlParam[]): Promise<T | undefined>;
  run(sql: string, params?: SqlParam[]): Promise<RunResult>;
  batch(statements: { sql: string; params?: SqlParam[] }[]): Promise<RunResult[]>;
}

// ─── Cloudflare D1 backend ───────────────────────────────────────────────────
class D1Backend implements Backend {
  readonly kind = "d1" as const;
  constructor(private readonly db: any) {}

  async all<T = Row>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    const result = await this.db.prepare(sql).bind(...params).all();
    return (result?.results ?? []) as T[];
  }

  async get<T = Row>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
    const row = await this.db.prepare(sql).bind(...params).first();
    return (row ?? undefined) as T | undefined;
  }

  async run(sql: string, params: SqlParam[] = []): Promise<RunResult> {
    const result = await this.db.prepare(sql).bind(...params).run();
    return {
      changes: Number(result?.meta?.changes ?? 0),
      lastInsertRowid: Number(result?.meta?.last_row_id ?? 0),
    };
  }

  async batch(statements: { sql: string; params?: SqlParam[] }[]): Promise<RunResult[]> {
    if (statements.length === 0) return [];
    const prepared = statements.map((s) => this.db.prepare(s.sql).bind(...(s.params ?? [])));
    const results = await this.db.batch(prepared);
    return (results ?? []).map((r: any) => ({
      changes: Number(r?.meta?.changes ?? 0),
      lastInsertRowid: Number(r?.meta?.last_row_id ?? 0),
    }));
  }
}

// ─── Node.js (node:sqlite) backend ───────────────────────────────────────────
class SqliteBackend implements Backend {
  readonly kind = "sqlite" as const;
  constructor(private readonly db: any) {}

  async all<T = Row>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async get<T = Row>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  async run(sql: string, params: SqlParam[] = []): Promise<RunResult> {
    const result = this.db.prepare(sql).run(...params);
    return {
      changes: Number(result?.changes ?? 0),
      lastInsertRowid: Number(result?.lastInsertRowid ?? 0),
    };
  }

  async batch(statements: { sql: string; params?: SqlParam[] }[]): Promise<RunResult[]> {
    const out: RunResult[] = [];
    for (const s of statements) out.push(await this.run(s.sql, s.params ?? []));
    return out;
  }
}

// ─── Backend selection ───────────────────────────────────────────────────────
let backendPromise: Promise<Backend> | null = null;

async function createBackend(): Promise<Backend> {
  // 1. Cloudflare Workers: the `cloudflare:workers` virtual module always
  //    resolves inside workerd and exposes the configured bindings.
  let cfEnv: any = null;
  let onWorkers = false;
  try {
    const specifier = "cloudflare:workers";
    const mod: any = await import(/* @vite-ignore */ specifier);
    onWorkers = true;
    cfEnv = mod?.env ?? null;
  } catch {
    onWorkers = false;
  }

  if (onWorkers) {
    const d1 = cfEnv?.DB;
    if (d1 && typeof d1.prepare === "function") return new D1Backend(d1);
    throw new Error(
      "Cloudflare Workers detected, but the D1 binding `DB` is not configured. " +
        "Create a D1 database and add a [[d1_databases]] binding named DB to your wrangler configuration, then redeploy.",
    );
  }

  // 2. Node.js: file-backed SQLite (local development / self-hosting).
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { DatabaseSync } = await import("node:sqlite");

  const candidates = [
    process.env.NOVA_DB_DIR,
    path.join(process.cwd(), "data"),
    path.join("/tmp", "nova-data"),
    path.join((await import("node:os")).tmpdir(), "nova-data"),
  ].filter((dir): dir is string => Boolean(dir));

  let dir: string | null = null;
  for (const candidate of candidates) {
    try {
      fs.mkdirSync(candidate, { recursive: true });
      dir = candidate;
      break;
    } catch {
      /* not writable — try the next candidate */
    }
  }
  if (!dir) throw new Error("No writable directory available for the SQLite database.");

  const db = new DatabaseSync(path.join(dir, "nova.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return new SqliteBackend(db);
}

async function getBackend(): Promise<Backend> {
  if (!backendPromise) {
    backendPromise = (async () => {
      const backend = await createBackend();
      await migrate(backend);
      return backend;
    })();
    // Do not cache failed initialisation (e.g. transient D1 error).
    backendPromise.catch(() => {
      backendPromise = null;
    });
  }
  const backend = await backendPromise;
  await maybeSeed(backend);
  return backend;
}

// ─── Hashing (Web Crypto — works on Workers and Node 20+) ────────────────────
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  return sha256Hex(salt + password);
}

export function generateSalt(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

// ─── Schema ──────────────────────────────────────────────────────────────────
// One statement per array entry: D1 rejects multi-statement strings.
const SCHEMA_STATEMENTS: string[] = [
  `CREATE TABLE IF NOT EXISTS categories (
    name TEXT PRIMARY KEY
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    compare_at_cents INTEGER,
    category TEXT NOT NULL,
    emoji TEXT NOT NULL,
    image TEXT NOT NULL,
    gradient TEXT NOT NULL,
    rating REAL NOT NULL,
    reviews INTEGER NOT NULL,
    stock INTEGER NOT NULL,
    featured INTEGER NOT NULL DEFAULT 0,
    features TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    author TEXT NOT NULL,
    rating INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    date TEXT NOT NULL,
    verified INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS wishlist (
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (session_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS cart_items (
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    PRIMARY KEY (session_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS recently_viewed (
    session_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (session_id, product_id)
  )`,
  `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    zip TEXT NOT NULL,
    subtotal_cents INTEGER NOT NULL,
    shipping_cents INTEGER NOT NULL,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    total_cents INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    quantity INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON recently_viewed(session_id, viewed_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique ON reviews(product_id, author, date)`,
];

// Columns added after the initial schema (idempotent; D1 has no
// `ALTER TABLE ... IF NOT EXISTS`, so each one is attempted and ignored).
const COLUMN_MIGRATIONS: string[] = [
  `ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE sessions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE orders ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0`,
];

const POST_MIGRATION_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
];

async function migrate(backend: Backend): Promise<void> {
  for (const statement of SCHEMA_STATEMENTS) {
    await backend.run(statement);
  }
  for (const statement of COLUMN_MIGRATIONS) {
    try {
      await backend.run(statement);
    } catch {
      /* column already exists */
    }
  }
  for (const statement of POST_MIGRATION_INDEXES) {
    try {
      await backend.run(statement);
    } catch {
      /* ignore */
    }
  }
}

// ─── Seeding ─────────────────────────────────────────────────────────────────
// D1 allows at most 100 bound parameters per query, so rows are grouped into
// statements that stay below that limit. Seeding is resumable: a cursor in the
// `meta` table lets a Worker seed a slice per request (free-plan invocations
// only allow 50 queries). Every insert is idempotent (OR IGNORE + unique
// indexes), so concurrent isolates cannot corrupt the data.
const PRODUCT_COLUMNS = 15;
const PRODUCTS_PER_STATEMENT = 6; // 6 × 15 = 90 params
const REVIEW_COLUMNS = 7;
const REVIEWS_PER_STATEMENT = 14; // 14 × 7 = 98 params
const SEED_STATEMENTS_PER_REQUEST = 30;
const SEED_THROTTLE_MS = 250;
const SEED_CURSOR_KEY = "seed_cursor";

// Per-isolate seeding progress. `seedDone` avoids touching the meta table on
// every query once the catalog has been seeded.
let seedDone = false;
let lastSeedAt = 0;

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function placeholders(rows: number, columns: number): string {
  return Array.from({ length: rows }, () => `(${Array.from({ length: columns }, () => "?").join(",")})`).join(",");
}

async function buildSeedStatements(): Promise<{ sql: string; params: SqlParam[] }[]> {
  const statements: { sql: string; params: SqlParam[] }[] = [];

  // The admin account goes FIRST. Seeding is sliced across requests, so if the
  // catalog was written ahead of it a fresh deployment would not accept the
  // documented admin login until ~1000 products had been inserted.
  const salt = generateSalt();
  const hash = await hashPassword("admin123", salt);
  statements.push({
    sql: `INSERT OR IGNORE INTO users (id, email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, 'admin')`,
    params: [crypto.randomUUID(), "admin@nova.com", "Admin", hash, salt],
  });

  statements.push({
    sql: `INSERT OR IGNORE INTO categories (name) VALUES ${placeholders(seedCategories.length, 1)}`,
    params: seedCategories,
  });

  for (const products of chunk(seedProducts, PRODUCTS_PER_STATEMENT)) {
    const params: SqlParam[] = [];
    for (const p of products) {
      params.push(
        p.id, p.name, p.tagline, p.description,
        p.priceCents, p.compareAtCents, p.category,
        p.emoji, p.image, p.gradient,
        p.rating, p.reviews, p.stock,
        p.featured ? 1 : 0, JSON.stringify(p.features),
      );
    }
    statements.push({
      sql: `INSERT OR IGNORE INTO products (
        id, name, tagline, description, price_cents, compare_at_cents,
        category, emoji, image, gradient, rating, reviews, stock, featured, features
      ) VALUES ${placeholders(products.length, PRODUCT_COLUMNS)}`,
      params,
    });
  }

  const reviewRows: SqlParam[][] = [];
  for (const p of seedProducts) {
    for (const r of seedReviewsFor(p.id)) {
      reviewRows.push([p.id, r.author, r.rating, r.title, r.body, r.date, r.verified ? 1 : 0]);
    }
  }
  for (const reviews of chunk(reviewRows, REVIEWS_PER_STATEMENT)) {
    statements.push({
      sql: `INSERT OR IGNORE INTO reviews (product_id, author, rating, title, body, date, verified)
            VALUES ${placeholders(reviews.length, REVIEW_COLUMNS)}`,
      params: reviews.flat(),
    });
  }

  return statements;
}

async function maybeSeed(backend: Backend): Promise<void> {
  if (seedDone) return;

  const rows = await backend.all<{ value: string }>("SELECT value FROM meta WHERE key = ?", [SEED_CURSOR_KEY]);
  if (rows[0]?.value === "done") {
    seedDone = true;
    return;
  }

  if (backend.kind === "sqlite") {
    // Local Node dev: seed everything in one go.
    const statements = await buildSeedStatements();
    await backend.batch(statements);
    await backend.run(
      `INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
      [SEED_CURSOR_KEY, "done"],
    );
    seedDone = true;
    return;
  }

  // D1: advance a bounded slice per request so free-plan query limits hold.
  // Throttled so a single page render (several DB calls) only advances once.
  const now = Date.now();
  if (now - lastSeedAt < SEED_THROTTLE_MS) return;
  lastSeedAt = now;

  const statements = await buildSeedStatements();
  const cursorRow = await backend.get<{ value: string }>("SELECT value FROM meta WHERE key = ?", [SEED_CURSOR_KEY]);
  const cursor = Number(cursorRow?.value ?? 0) || 0;
  const slice = statements.slice(cursor, cursor + SEED_STATEMENTS_PER_REQUEST);
  if (slice.length > 0) await backend.batch(slice);

  const next = cursor + slice.length;
  const value = next >= statements.length ? "done" : String(next);
  await backend.run(
    `INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value`,
    [SEED_CURSOR_KEY, value],
  );
  if (value === "done") seedDone = true;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
type UserRow = { id: string; email: string; name: string; password_hash: string; salt: string; role: string };

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  const backend = await getBackend();
  return backend.get<UserRow>("SELECT * FROM users WHERE email = ?", [email.toLowerCase().trim()]);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const backend = await getBackend();
  const row = await backend.get<{ id: string; email: string; name: string; role: string }>(
    "SELECT id, email, name, role FROM users WHERE id = ?",
    [id],
  );
  if (!row) return undefined;
  return { id: row.id, email: row.email, name: row.name, role: row.role as "admin" | "customer" };
}

export async function createUser(email: string, name: string, password: string): Promise<User> {
  const backend = await getBackend();
  const existing = await getUserByEmail(email);
  if (existing) throw new Error("Email already registered");
  const id = crypto.randomUUID();
  const salt = generateSalt();
  const hash = await hashPassword(password, salt);
  await backend.run(
    `INSERT INTO users (id, email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, 'customer')`,
    [id, email.toLowerCase().trim(), name.trim(), hash, salt],
  );
  return { id, email: email.toLowerCase().trim(), name: name.trim(), role: "customer" };
}

export async function verifyPassword(email: string, password: string): Promise<User | null> {
  const row = await getUserByEmail(email);
  if (!row) return null;
  const hash = await hashPassword(password, row.salt);
  if (hash !== row.password_hash) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role as "admin" | "customer" };
}

// ─── Sessions ────────────────────────────────────────────────────────────────
export async function createSession(sessionId: string, userId?: string): Promise<void> {
  const backend = await getBackend();
  await backend.run(`INSERT OR REPLACE INTO sessions (id, user_id) VALUES (?, ?)`, [sessionId, userId ?? null]);
}

export async function linkSessionToUser(sessionId: string, userId: string): Promise<void> {
  const backend = await getBackend();
  await backend.run("UPDATE sessions SET user_id = ? WHERE id = ?", [userId, sessionId]);
}

export async function getUserFromSession(sessionId: string): Promise<User | undefined> {
  const backend = await getBackend();
  const row = await backend.get<{ id: string; email: string; name: string; role: string }>(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
    [sessionId],
  );
  if (!row) return undefined;
  return { id: row.id, email: row.email, name: row.name, role: row.role as "admin" | "customer" };
}

export async function clearSessionUser(sessionId: string): Promise<void> {
  const backend = await getBackend();
  await backend.run("UPDATE sessions SET user_id = NULL WHERE id = ?", [sessionId]);
}

// ─── Product row helpers ─────────────────────────────────────────────────────
type ProductRow = {
  id: string; name: string; tagline: string; description: string;
  price_cents: number; compare_at_cents: number | null;
  category: string; emoji: string; image: string; gradient: string;
  rating: number; reviews: number; stock: number; featured: number; features: string;
};

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id, name: row.name, tagline: row.tagline, description: row.description,
    price: row.price_cents / 100,
    compareAt: row.compare_at_cents ? row.compare_at_cents / 100 : undefined,
    category: row.category, emoji: row.emoji, image: row.image, gradient: row.gradient,
    rating: row.rating, reviews: row.reviews, stock: row.stock, featured: row.featured === 1,
  };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── Product reads ───────────────────────────────────────────────────────────
export async function getProductFeatures(productId: string): Promise<string[]> {
  const backend = await getBackend();
  const row = await backend.get<{ features: string }>("SELECT features FROM products WHERE id = ?", [productId]);
  if (!row) return [];
  try { return JSON.parse(row.features) as string[]; } catch { return []; }
}

export async function getAllProducts(): Promise<Product[]> {
  const backend = await getBackend();
  return (await backend.all<ProductRow>("SELECT * FROM products ORDER BY featured DESC, name ASC")).map(rowToProduct);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const backend = await getBackend();
  return (await backend.all<ProductRow>("SELECT * FROM products WHERE featured = 1 ORDER BY name ASC")).map(rowToProduct);
}

export async function getProduct(id: string): Promise<Product | undefined> {
  const backend = await getBackend();
  const row = await backend.get<ProductRow>("SELECT * FROM products WHERE id = ?", [id]);
  return row ? rowToProduct(row) : undefined;
}

export async function getCategories(): Promise<string[]> {
  const backend = await getBackend();
  return (await backend.all<{ name: string }>("SELECT name FROM categories ORDER BY name ASC")).map((r) => r.name);
}

/** Pure helper — no database access, intentionally synchronous. */
export function searchProducts(list: Product[], query: string, sort: SortKey): Product[] {
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? list.filter((p) => [p.name, p.tagline, p.description, p.category].join(" ").toLowerCase().includes(needle))
    : list;
  switch (sort) {
    case "price-asc": return [...filtered].sort((a, b) => a.price - b.price);
    case "price-desc": return [...filtered].sort((a, b) => b.price - a.price);
    case "rating": return [...filtered].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
    default: return [...filtered];
  }
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const backend = await getBackend();
  return (await backend.all<ProductRow>("SELECT * FROM products WHERE category = ? ORDER BY name ASC", [category])).map(rowToProduct);
}

// ─── Product mutations (admin) ───────────────────────────────────────────────
export async function adminCreateProduct(input: AdminProductInput): Promise<Product> {
  const backend = await getBackend();
  const id = slugify(input.name) + "-" + Date.now().toString(36);
  const gradients = [
    "from-violet-500 to-indigo-600", "from-sky-500 to-cyan-400",
    "from-fuchsia-500 to-pink-500", "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500", "from-red-500 to-rose-600",
  ];
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  await backend.run(
    `INSERT INTO products (id, name, tagline, description, price_cents, compare_at_cents,
      category, emoji, image, gradient, rating, reviews, stock, featured, features)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
    [
      id, input.name, input.tagline, input.description,
      Math.round(input.price * 100),
      input.compareAt ? Math.round(input.compareAt * 100) : null,
      input.category, input.emoji || "📦", input.image || "", gradient,
      input.stock, input.featured ? 1 : 0,
      JSON.stringify(input.features || []),
    ],
  );

  await backend.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [input.category]);

  return (await getProduct(id))!;
}

export async function adminUpdateProduct(id: string, input: Partial<AdminProductInput>): Promise<Product | undefined> {
  const backend = await getBackend();
  const existing = await backend.get<ProductRow>("SELECT * FROM products WHERE id = ?", [id]);
  if (!existing) return undefined;

  await backend.run(
    `UPDATE products SET
      name = ?, tagline = ?, description = ?, price_cents = ?, compare_at_cents = ?,
      category = ?, emoji = ?, image = ?, stock = ?, featured = ?, features = ?
     WHERE id = ?`,
    [
      input.name ?? existing.name,
      input.tagline ?? existing.tagline,
      input.description ?? existing.description,
      input.price !== undefined ? Math.round(input.price * 100) : existing.price_cents,
      input.compareAt !== undefined ? (input.compareAt ? Math.round(input.compareAt * 100) : null) : existing.compare_at_cents,
      input.category ?? existing.category,
      input.emoji ?? existing.emoji,
      input.image ?? existing.image,
      input.stock ?? existing.stock,
      input.featured !== undefined ? (input.featured ? 1 : 0) : existing.featured,
      JSON.stringify(input.features ?? JSON.parse(existing.features)),
      id,
    ],
  );
  if (input.category) await backend.run("INSERT OR IGNORE INTO categories (name) VALUES (?)", [input.category]);
  return getProduct(id);
}

export async function adminDeleteProduct(id: string): Promise<boolean> {
  const backend = await getBackend();
  const info = await backend.run("DELETE FROM products WHERE id = ?", [id]);
  return info.changes > 0;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export async function getReviews(productId: string): Promise<Review[]> {
  const backend = await getBackend();
  const rows = await backend.all<{
    author: string; rating: number; title: string; body: string; date: string; verified: number;
  }>("SELECT * FROM reviews WHERE product_id = ? ORDER BY date DESC", [productId]);
  return rows.map((row) => ({
    author: row.author, rating: row.rating, title: row.title,
    body: row.body, date: row.date, verified: row.verified === 1,
  }));
}

// ─── Cart ────────────────────────────────────────────────────────────────────
export async function getCartItems(sessionId: string): Promise<CartItem[]> {
  if (!sessionId) return [];
  const backend = await getBackend();
  const rows = await backend.all<ProductRow & { quantity: number }>(
    `SELECT p.*, c.quantity FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.session_id = ? ORDER BY c.rowid ASC`,
    [sessionId],
  );
  return rows.map((row) => ({ product: rowToProduct(row), quantity: row.quantity }));
}

export async function setCartItem(sessionId: string, productId: string, quantity: number): Promise<CartItem[]> {
  if (quantity <= 0) return removeCartItem(sessionId, productId);
  const backend = await getBackend();
  const product = await getProduct(productId);
  if (!product) return getCartItems(sessionId);
  const capped = Math.min(quantity, product.stock);
  await backend.run(
    `INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (session_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
    [sessionId, productId, capped],
  );
  return getCartItems(sessionId);
}

export async function removeCartItem(sessionId: string, productId: string): Promise<CartItem[]> {
  const backend = await getBackend();
  await backend.run("DELETE FROM cart_items WHERE session_id = ? AND product_id = ?", [sessionId, productId]);
  return getCartItems(sessionId);
}

export async function clearCart(sessionId: string): Promise<CartItem[]> {
  const backend = await getBackend();
  await backend.run("DELETE FROM cart_items WHERE session_id = ?", [sessionId]);
  return [];
}

// ─── Wishlist ────────────────────────────────────────────────────────────────
export async function getWishlistIds(sessionId: string): Promise<string[]> {
  if (!sessionId) return [];
  const backend = await getBackend();
  return (await backend.all<{ product_id: string }>(
    "SELECT product_id FROM wishlist WHERE session_id = ? ORDER BY created_at DESC",
    [sessionId],
  )).map((r) => r.product_id);
}

export async function toggleWishlist(sessionId: string, productId: string): Promise<boolean> {
  const backend = await getBackend();
  const existing = await backend.get("SELECT 1 AS hit FROM wishlist WHERE session_id = ? AND product_id = ?", [sessionId, productId]);
  if (existing) {
    await backend.run("DELETE FROM wishlist WHERE session_id = ? AND product_id = ?", [sessionId, productId]);
    return false;
  }
  await backend.run("INSERT OR REPLACE INTO wishlist (session_id, product_id) VALUES (?, ?)", [sessionId, productId]);
  return true;
}

// ─── Recently viewed ─────────────────────────────────────────────────────────
export async function recordRecentView(sessionId: string, productId: string): Promise<void> {
  if (!sessionId) return;
  const backend = await getBackend();
  await backend.run(
    `INSERT INTO recently_viewed (session_id, product_id) VALUES (?, ?)
     ON CONFLICT (session_id, product_id) DO UPDATE SET viewed_at = datetime('now')`,
    [sessionId, productId],
  );
}

export async function getRecentViews(sessionId: string, limit = 4): Promise<Product[]> {
  if (!sessionId) return [];
  const backend = await getBackend();
  return (await backend.all<ProductRow>(
    `SELECT p.* FROM recently_viewed rv
     JOIN products p ON p.id = rv.product_id
     WHERE rv.session_id = ? ORDER BY rv.viewed_at DESC LIMIT ?`,
    [sessionId, limit],
  )).map(rowToProduct);
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export async function placeOrder(
  sessionId: string | null,
  input: OrderInput,
  items: CartItem[],
  subtotal: number,
  shipping: number,
  userId?: string,
): Promise<OrderConfirmation> {
  // ── Server-side validation ────────────────────────────────────────────────
  const { fullName, email, address, city, zip } = input;
  if (!fullName?.trim() || !email?.trim() || !address?.trim() || !city?.trim() || !zip?.trim()) {
    throw new Error("All shipping fields are required");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new Error("Invalid email address");
  }
  if (!items || items.length === 0) {
    throw new Error("Cart is empty");
  }

  const backend = await getBackend();

  // ── Re-fetch authoritative prices from DB (never trust client prices) ─────
  let authoritative_subtotal = 0;
  const resolvedItems: { id: string; name: string; priceCents: number; quantity: number }[] = [];

  for (const item of items) {
    const product = await getProduct(item.product.id);
    if (!product) throw new Error(`Product not found: ${item.product.id}`);
    const qty = Math.max(1, Math.min(Math.floor(item.quantity), product.stock));
    authoritative_subtotal += product.price * qty;
    resolvedItems.push({
      id: product.id,
      name: product.name,
      priceCents: Math.round(product.price * 100),
      quantity: qty,
    });
  }

  // ── Recompute shipping and tax server-side ────────────────────────────────
  const TAX_RATE_SERVER = 0.08;
  const FREE_SHIPPING_THRESHOLD_SERVER = 100;
  const FLAT_SHIPPING_SERVER = 12;

  const authShipping =
    authoritative_subtotal >= FREE_SHIPPING_THRESHOLD_SERVER ? 0 : FLAT_SHIPPING_SERVER;
  const authTax = parseFloat((authoritative_subtotal * TAX_RATE_SERVER).toFixed(2));
  const authTotal = parseFloat((authoritative_subtotal + authShipping + authTax).toFixed(2));

  const orderNumber = `NOVA-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

  const info = await backend.run(
    `INSERT INTO orders (session_id, user_id, order_number, full_name, email, address, city, zip,
      subtotal_cents, shipping_cents, tax_cents, total_cents, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
    [
      sessionId,
      userId ?? null,
      orderNumber,
      input.fullName.trim(),
      input.email.trim(),
      input.address.trim(),
      input.city.trim(),
      input.zip.trim(),
      Math.round(authoritative_subtotal * 100),
      Math.round(authShipping * 100),
      Math.round(authTax * 100),
      Math.round(authTotal * 100),
    ],
  );
  const orderId = info.lastInsertRowid;

  let itemCount = 0;
  await backend.batch(resolvedItems.map((item) => {
    itemCount += item.quantity;
    return {
      sql: `INSERT INTO order_items (order_id, product_id, product_name, price_cents, quantity) VALUES (?, ?, ?, ?, ?)`,
      params: [orderId, item.id, item.name, item.priceCents, item.quantity],
    };
  }));

  if (sessionId) await backend.run("DELETE FROM cart_items WHERE session_id = ?", [sessionId]);

  return {
    orderNumber,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    subtotal: authoritative_subtotal,
    shipping: authShipping,
    tax: authTax,
    total: authTotal,
    itemCount,
  };
}

export async function getOrdersByUser(userId: string): Promise<AdminOrderRow[]> {
  const backend = await getBackend();
  return backend.all<AdminOrderRow>(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC`,
    [userId],
  );
}

// ─── Admin queries ───────────────────────────────────────────────────────────
export async function adminGetAllOrders(limit = 100, offset = 0): Promise<AdminOrderRow[]> {
  const backend = await getBackend();
  return backend.all<AdminOrderRow>(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [limit, offset],
  );
}

export async function adminGetOrderById(id: number): Promise<AdminOrderRow | undefined> {
  const backend = await getBackend();
  return backend.get<AdminOrderRow>(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = ? GROUP BY o.id`,
    [id],
  );
}

export async function adminUpdateOrderStatus(id: number, status: string): Promise<boolean> {
  const backend = await getBackend();
  const info = await backend.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  return info.changes > 0;
}

export async function adminGetStats(): Promise<{
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
  totalUsers: number;
  recentOrders: AdminOrderRow[];
}> {
  const backend = await getBackend();
  const totalProducts = (await backend.get<{ c: number }>("SELECT COUNT(*) AS c FROM products"))?.c ?? 0;
  const totalOrders = (await backend.get<{ c: number }>("SELECT COUNT(*) AS c FROM orders"))?.c ?? 0;
  const totalRevenueCents = (await backend.get<{ c: number }>("SELECT COALESCE(SUM(total_cents),0) AS c FROM orders"))?.c ?? 0;
  const totalUsers = (await backend.get<{ c: number }>("SELECT COUNT(*) AS c FROM users"))?.c ?? 0;
  const recentOrders = await backend.all<AdminOrderRow>(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5`,
  );
  return { totalProducts, totalOrders, totalRevenueCents, totalUsers, recentOrders };
}

// ─── Misc ────────────────────────────────────────────────────────────────────
export async function countProducts(): Promise<number> {
  const backend = await getBackend();
  return (await backend.get<{ count: number }>("SELECT COUNT(*) AS count FROM products"))?.count ?? 0;
}

export function getDbPath(): string {
  try {
    return `${process.env.NOVA_DB_DIR ?? `${process.cwd()}/data`}/nova.db`;
  } catch {
    return "d1";
  }
}

export async function resetDatabase(): Promise<void> {
  const backend = await getBackend();
  const tables = [
    "order_items", "orders", "recently_viewed", "cart_items", "wishlist",
    "sessions", "reviews", "products", "categories", "meta",
  ];
  await backend.batch(tables.map((table) => ({ sql: `DELETE FROM ${table}` })));
  seedDone = false;
  lastSeedAt = 0;
  await maybeSeed(backend);
}
