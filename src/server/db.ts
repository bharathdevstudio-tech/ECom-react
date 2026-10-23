import type {
  CartItem,
  OrderConfirmation,
  OrderInput,
  Product,
  Review,
  ReviewInput,
  SortKey,
  User,
  AdminOrderRow,
  AdminProductInput,
  Coupon,
  CouponInput,
  CouponType,
  UserProfile,
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
    user_id TEXT,
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
  `CREATE TABLE IF NOT EXISTS coupons (
    code TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    value INTEGER NOT NULL,
    min_subtotal_cents INTEGER NOT NULL DEFAULT 0,
    max_uses INTEGER,
    uses INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    expires_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS inventory_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    delta INTEGER NOT NULL,
    reason TEXT NOT NULL,
    order_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`,
  `CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON recently_viewed(session_id, viewed_at)`,
];

// Columns added after the initial schema (idempotent; D1 has no
// `ALTER TABLE ... IF NOT EXISTS`, so each one is attempted and ignored).
const COLUMN_MIGRATIONS: string[] = [
  `ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE sessions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE orders ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN discount_cents INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE orders ADD COLUMN coupon_code TEXT`,
  `ALTER TABLE reviews ADD COLUMN user_id TEXT`,
];

// Indexes that depend on migrated columns, or that replace an older index.
const POST_MIGRATION_INDEXES: string[] = [
  `CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number)`,
  `CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_movements(product_id)`,
  // Reviews used to be unique on (product_id, author, date). Customer reviews
  // are unique per user instead, while seeded reviews keep their dedupe key.
  `DROP INDEX IF EXISTS idx_reviews_unique`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_seed_unique
     ON reviews(product_id, author, date) WHERE user_id IS NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_user_unique
     ON reviews(product_id, user_id) WHERE user_id IS NOT NULL`,
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
const SEED_CURSOR_KEY = "seed_cursor_v2_catalog";

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

  // Fresh catalog load: clear existing catalog data so the new Flipkart-style
  // products replace everything that was previously seeded.
  statements.push({ sql: "DELETE FROM recently_viewed", params: [] });
  statements.push({ sql: "DELETE FROM wishlist", params: [] });
  statements.push({ sql: "DELETE FROM cart_items", params: [] });
  statements.push({ sql: "DELETE FROM inventory_movements", params: [] });
  statements.push({ sql: "DELETE FROM reviews", params: [] });
  statements.push({ sql: "DELETE FROM products", params: [] });
  statements.push({ sql: "DELETE FROM categories", params: [] });

  // The admin account goes FIRST.
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

// ─── Customer profile ────────────────────────────────────────────────────────
export async function getUserProfile(userId: string): Promise<UserProfile | undefined> {
  const backend = await getBackend();
  const row = await backend.get<{
    id: string; email: string; name: string; role: string; created_at: string;
  }>("SELECT id, email, name, role, created_at FROM users WHERE id = ?", [userId]);
  if (!row) return undefined;

  const orderStats = await backend.get<{ count: number; total: number }>(
    "SELECT COUNT(*) AS count, COALESCE(SUM(total_cents), 0) AS total FROM orders WHERE user_id = ?",
    [userId],
  );
  const reviewStats = await backend.get<{ count: number }>(
    "SELECT COUNT(*) AS count FROM reviews WHERE user_id = ?",
    [userId],
  );

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as "admin" | "customer",
    // SQLite stores UTC as "YYYY-MM-DD HH:MM:SS"; make it an unambiguous ISO string.
    createdAt: row.created_at.includes("T")
      ? row.created_at
      : `${row.created_at.replace(" ", "T")}Z`,
    stats: {
      orders: Number(orderStats?.count ?? 0),
      totalSpentCents: Number(orderStats?.total ?? 0),
      reviews: Number(reviewStats?.count ?? 0),
    },
  };
}

export async function updateUserProfile(
  userId: string,
  input: { name?: string; email?: string },
): Promise<User> {
  const backend = await getBackend();
  const current = await getUserById(userId);
  if (!current) throw new Error("Account not found");

  const name = (input.name ?? current.name).trim();
  const email = (input.email ?? current.email).toLowerCase().trim();

  if (!name) throw new Error("Name is required");
  if (name.length > 80) throw new Error("Name is too long (max 80 characters)");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");

  const existing = await getUserByEmail(email);
  if (existing && existing.id !== userId) throw new Error("That email is already in use");

  await backend.run("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, userId]);
  return (await getUserById(userId))!;
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const backend = await getBackend();
  const row = await backend.get<UserRow>("SELECT * FROM users WHERE id = ?", [userId]);
  if (!row) throw new Error("Account not found");

  const currentHash = await hashPassword(currentPassword ?? "", row.salt);
  if (currentHash !== row.password_hash) throw new Error("Current password is incorrect");
  if (!newPassword || newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters");
  }
  if (newPassword === currentPassword) {
    throw new Error("New password must be different from the current one");
  }

  const salt = generateSalt();
  const hash = await hashPassword(newPassword, salt);
  await backend.run("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?", [hash, salt, userId]);
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
type ReviewRow = {
  author: string; rating: number; title: string; body: string; date: string; verified: number;
  user_id?: string | null;
};

function rowToReview(row: ReviewRow): Review {
  return {
    author: row.author,
    rating: row.rating,
    title: row.title,
    body: row.body,
    date: row.date,
    verified: row.verified === 1,
    userId: row.user_id ?? undefined,
  };
}

export async function getReviews(productId: string): Promise<Review[]> {
  const backend = await getBackend();
  const rows = await backend.all<ReviewRow>(
    "SELECT * FROM reviews WHERE product_id = ? ORDER BY date DESC, id DESC",
    [productId],
  );
  return rows.map(rowToReview);
}

export async function getUserReview(productId: string, userId: string): Promise<Review | undefined> {
  const backend = await getBackend();
  const row = await backend.get<ReviewRow>(
    "SELECT * FROM reviews WHERE product_id = ? AND user_id = ?",
    [productId, userId],
  );
  return row ? rowToReview(row) : undefined;
}

export async function addReview(
  productId: string,
  userId: string,
  author: string,
  input: ReviewInput,
): Promise<Review> {
  const backend = await getBackend();
  const product = await getProduct(productId);
  if (!product) throw new Error("Product not found");

  const rating = Math.round(Number(input.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Choose a rating between 1 and 5 stars");
  }
  const title = input.title.trim();
  const body = input.body.trim();
  if (title.length < 3) throw new Error("Add a title of at least 3 characters");
  if (title.length > 120) throw new Error("Title is too long (max 120 characters)");
  if (body.length < 10) throw new Error("Tell us a little more (at least 10 characters)");
  if (body.length > 2000) throw new Error("Review is too long (max 2000 characters)");

  if (await getUserReview(productId, userId)) {
    throw new Error("You have already reviewed this product");
  }

  // A review counts as verified when the customer has an order with this item.
  const purchased = await backend.get<{ hit: number }>(
    `SELECT 1 AS hit FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = ? AND oi.product_id = ? LIMIT 1`,
    [userId, productId],
  );

  const date = new Date().toISOString().slice(0, 10);

  try {
    await backend.run(
      `INSERT INTO reviews (product_id, user_id, author, rating, title, body, date, verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [productId, userId, author, rating, title, body, date, purchased ? 1 : 0],
    );
  } catch {
    // The partial unique index is the final guard against double submits.
    throw new Error("You have already reviewed this product");
  }

  // Roll the seeded aggregate forward rather than recomputing it from the
  // handful of seeded review rows (which would collapse the catalog ratings).
  await backend.run(
    `UPDATE products
     SET rating = ROUND((rating * reviews + ?) / (reviews + 1), 2),
         reviews = reviews + 1
     WHERE id = ?`,
    [rating, productId],
  );

  return { author, rating, title, body, date, verified: Boolean(purchased), userId };
}

// ─── Coupons ─────────────────────────────────────────────────────────────────
type CouponRow = {
  code: string;
  type: string;
  value: number;
  min_subtotal_cents: number;
  max_uses: number | null;
  uses: number;
  active: number;
  expires_at: string | null;
  created_at: string;
};

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

function couponLabel(type: CouponType, value: number): string {
  return type === "percent" ? `${value}% off` : `$${(value / 100).toFixed(2)} off`;
}

function rowToCoupon(row: CouponRow): Coupon {
  return {
    code: row.code,
    type: row.type === "percent" ? "percent" : "fixed",
    value: row.value,
    minSubtotalCents: row.min_subtotal_cents,
    maxUses: row.max_uses ?? null,
    uses: row.uses,
    active: row.active === 1,
    expiresAt: row.expires_at ?? null,
    createdAt: row.created_at,
  };
}

export async function getCoupon(code: string): Promise<Coupon | undefined> {
  const backend = await getBackend();
  const row = await backend.get<CouponRow>(
    "SELECT * FROM coupons WHERE code = ?",
    [normalizeCouponCode(code)],
  );
  return row ? rowToCoupon(row) : undefined;
}

export async function listCoupons(): Promise<Coupon[]> {
  const backend = await getBackend();
  const rows = await backend.all<CouponRow>(
    "SELECT * FROM coupons ORDER BY created_at DESC, code ASC",
  );
  return rows.map(rowToCoupon);
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  const code = normalizeCouponCode(input.code);
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw new Error("Coupon code must be 3–32 characters (letters, numbers, - or _)");
  }
  if (input.type !== "percent" && input.type !== "fixed") {
    throw new Error("Coupon type must be 'percent' or 'fixed'");
  }
  const value = Math.round(Number(input.value));
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("Discount value must be at least 1");
  }
  if (input.type === "percent" && value > 100) {
    throw new Error("Percent discount cannot exceed 100");
  }

  const backend = await getBackend();
  if (await backend.get("SELECT 1 AS hit FROM coupons WHERE code = ?", [code])) {
    throw new Error(`Coupon ${code} already exists`);
  }

  const minSubtotalCents = Math.max(0, Math.round((input.minSubtotal ?? 0) * 100));
  const maxUses =
    input.maxUses == null || Number(input.maxUses) <= 0 ? null : Math.floor(Number(input.maxUses));
  const expiresAt = input.expiresAt?.trim() ? input.expiresAt.trim() : null;
  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) {
    throw new Error("Invalid expiry date");
  }

  await backend.run(
    `INSERT INTO coupons (code, type, value, min_subtotal_cents, max_uses, uses, active, expires_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
    [code, input.type, value, minSubtotalCents, maxUses, input.active === false ? 0 : 1, expiresAt],
  );

  return (await getCoupon(code))!;
}

export async function setCouponActive(code: string, active: boolean): Promise<boolean> {
  const backend = await getBackend();
  const info = await backend.run(
    "UPDATE coupons SET active = ? WHERE code = ?",
    [active ? 1 : 0, normalizeCouponCode(code)],
  );
  return info.changes > 0;
}

export async function deleteCoupon(code: string): Promise<boolean> {
  const backend = await getBackend();
  const info = await backend.run("DELETE FROM coupons WHERE code = ?", [normalizeCouponCode(code)]);
  return info.changes > 0;
}

/** Validates a code against an order subtotal (in cents) and returns the discount. */
export type CouponCheck =
  | { ok: true; code: string; discountCents: number; label: string }
  | { ok: false; error: string };

export async function validateCoupon(code: string, subtotalCents: number): Promise<CouponCheck> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { ok: false, error: "Enter a promo code" };

  const coupon = await getCoupon(normalized);
  if (!coupon) return { ok: false, error: "That promo code doesn't exist" };
  if (!coupon.active) return { ok: false, error: "That promo code is no longer active" };
  if (coupon.expiresAt && Date.parse(coupon.expiresAt) < Date.now()) {
    return { ok: false, error: "That promo code has expired" };
  }
  if (coupon.maxUses != null && coupon.uses >= coupon.maxUses) {
    return { ok: false, error: "That promo code has reached its usage limit" };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return {
      ok: false,
      error: `Spend at least $${(coupon.minSubtotalCents / 100).toFixed(2)} to use this code`,
    };
  }

  const raw =
    coupon.type === "percent"
      ? Math.round((subtotalCents * coupon.value) / 100)
      : coupon.value;
  const discountCents = Math.min(Math.max(0, raw), subtotalCents);
  if (discountCents <= 0) {
    return { ok: false, error: "That promo code gives no discount on this order" };
  }

  return {
    ok: true,
    code: coupon.code,
    discountCents,
    label: couponLabel(coupon.type, coupon.value),
  };
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
  couponCode?: string,
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
    if (product.stock <= 0) throw new Error(`${product.name} is out of stock`);
    const qty = Math.max(1, Math.min(Math.floor(item.quantity), product.stock));
    authoritative_subtotal += product.price * qty;
    resolvedItems.push({
      id: product.id,
      name: product.name,
      priceCents: Math.round(product.price * 100),
      quantity: qty,
    });
  }

  const subtotalCents = Math.round(authoritative_subtotal * 100);

  // ── Apply the promo code server-side ──────────────────────────────────────
  let discountCents = 0;
  let appliedCode: string | null = null;
  if (couponCode?.trim()) {
    const check = await validateCoupon(couponCode, subtotalCents);
    if (!check.ok) throw new Error(check.error);
    discountCents = check.discountCents;
    appliedCode = check.code;
  }

  // ── Recompute shipping and tax on the discounted subtotal ─────────────────
  const TAX_RATE_SERVER = 0.08;
  const FREE_SHIPPING_THRESHOLD_SERVER = 100;
  const FLAT_SHIPPING_SERVER = 12;

  const discountedSubtotal = (subtotalCents - discountCents) / 100;
  const authShipping =
    discountedSubtotal >= FREE_SHIPPING_THRESHOLD_SERVER ? 0 : FLAT_SHIPPING_SERVER;
  const authTax = parseFloat((discountedSubtotal * TAX_RATE_SERVER).toFixed(2));
  const authTotal = parseFloat((discountedSubtotal + authShipping + authTax).toFixed(2));

  // ── Reserve inventory atomically before writing the order ─────────────────
  // The conditional UPDATE means two concurrent checkouts can never drive
  // stock below zero: the loser sees `changes === 0` and we release the
  // reservations already made by this request.
  const reserved: { id: string; name: string; quantity: number }[] = [];
  for (const item of resolvedItems) {
    const result = await backend.run(
      "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
      [item.quantity, item.id, item.quantity],
    );
    if (result.changes === 0) {
      for (const done of reserved) {
        await backend.run("UPDATE products SET stock = stock + ? WHERE id = ?", [
          done.quantity,
          done.id,
        ]);
      }
      throw new Error(`Sorry, ${item.name} just sold out. Please review your cart.`);
    }
    reserved.push({ id: item.id, name: item.name, quantity: item.quantity });
  }

  const orderNumber = `NOVA-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000)}`;

  let orderId: number;
  try {
    const info = await backend.run(
      `INSERT INTO orders (session_id, user_id, order_number, full_name, email, address, city, zip,
        subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, coupon_code, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
      [
        sessionId,
        userId ?? null,
        orderNumber,
        input.fullName.trim(),
        input.email.trim(),
        input.address.trim(),
        input.city.trim(),
        input.zip.trim(),
        subtotalCents,
        discountCents,
        Math.round(authShipping * 100),
        Math.round(authTax * 100),
        Math.round(authTotal * 100),
        appliedCode,
      ],
    );
    orderId = info.lastInsertRowid;
  } catch (error) {
    // Order insert failed — put the reserved stock back.
    for (const done of reserved) {
      await backend.run("UPDATE products SET stock = stock + ? WHERE id = ?", [
        done.quantity,
        done.id,
      ]);
    }
    throw error;
  }

  let itemCount = 0;
  const orderStatements = resolvedItems.map((item) => {
    itemCount += item.quantity;
    return {
      sql: `INSERT INTO order_items (order_id, product_id, product_name, price_cents, quantity) VALUES (?, ?, ?, ?, ?)`,
      params: [orderId, item.id, item.name, item.priceCents, item.quantity],
    };
  });
  // Ledger entry per reserved line, so stock changes are auditable.
  const movementStatements = reserved.map((item) => ({
    sql: `INSERT INTO inventory_movements (product_id, delta, reason, order_id) VALUES (?, ?, 'order', ?)`,
    params: [item.id, -item.quantity, orderId] as SqlParam[],
  }));
  await backend.batch([...orderStatements, ...movementStatements]);

  if (appliedCode) {
    await backend.run("UPDATE coupons SET uses = uses + 1 WHERE code = ?", [appliedCode]);
  }

  if (sessionId) await backend.run("DELETE FROM cart_items WHERE session_id = ?", [sessionId]);

  return {
    orderNumber,
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    subtotal: authoritative_subtotal,
    discount: discountCents / 100,
    couponCode: appliedCode ?? undefined,
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

/**
 * Guest order tracking: an order number plus the email used at checkout.
 * Both values must match, so a number alone does not leak an order.
 */
export async function lookupOrder(
  orderNumber: string,
  email: string,
): Promise<AdminOrderRow | undefined> {
  const number = orderNumber.trim().toUpperCase();
  const mail = email.trim().toLowerCase();
  if (!number || !mail) return undefined;

  const backend = await getBackend();
  return backend.get<AdminOrderRow>(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE UPPER(o.order_number) = ? AND LOWER(o.email) = ?
     GROUP BY o.id`,
    [number, mail],
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
