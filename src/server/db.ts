import { mkdirSync } from "node:fs";
import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
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

const IS_SERVERLESS = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
const DATA_DIR = IS_SERVERLESS ? path.join("/tmp", "data") : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "nova.db");

let db: DatabaseSync | null = null;

// ─── Simple password hashing (SHA-256 + salt, no extra deps) ────────────────
export function hashPassword(password: string, salt: string): string {
  return createHash("sha256").update(salt + password).digest("hex");
}

export function generateSalt(): string {
  return randomUUID().replace(/-/g, "");
}

// ─── Init ────────────────────────────────────────────────────────────────────
function initDb(): DatabaseSync {
  if (db) return db;
  mkdirSync(DATA_DIR, { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  if (isEmpty(db)) {
    seed(db);
  }
  return db;
}

type Db = DatabaseSync;

// ─── Schema ──────────────────────────────────────────────────────────────────
function migrate(db: Db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      name TEXT PRIMARY KEY
    );

    CREATE TABLE IF NOT EXISTS products (
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
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT NOT NULL,
      author TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      date TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (session_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      PRIMARY KEY (session_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS recently_viewed (
      session_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (session_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
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
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price_cents INTEGER NOT NULL,
      quantity INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_recently_viewed_session ON recently_viewed(session_id, viewed_at);
  `);

  // Migration: add user_id column to orders if upgrading from old schema
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`);
  } catch { /* already exists */ }
  try {
    db.exec(`ALTER TABLE sessions ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE SET NULL`);
  } catch { /* already exists */ }
  // Migration: add tax_cents column to orders if upgrading from old schema
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN tax_cents INTEGER NOT NULL DEFAULT 0`);
  } catch { /* already exists */ }

  // Indexes on columns that may have been added via ALTER TABLE (must run after migrations)
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);
  } catch { /* ignore */ }
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)`);
  } catch { /* ignore */ }
}

function isEmpty(db: Db): boolean {
  const row = db.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number };
  return row.count === 0;
}

function seed(db: Db) {
  const insertCategory = db.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)");
  for (const name of seedCategories) {
    insertCategory.run(name);
  }

  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, name, tagline, description, price_cents, compare_at_cents,
      category, emoji, image, gradient, rating, reviews, stock, featured, features
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, author, rating, title, body, date, verified)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const product of seedProducts) {
    insertProduct.run(
      product.id, product.name, product.tagline, product.description,
      product.priceCents, product.compareAtCents, product.category,
      product.emoji, product.image, product.gradient,
      product.rating, product.reviews, product.stock,
      product.featured ? 1 : 0, JSON.stringify(product.features),
    );
    for (const review of seedReviewsFor(product.id)) {
      insertReview.run(
        product.id, review.author, review.rating,
        review.title, review.body, review.date, review.verified ? 1 : 0,
      );
    }
  }

  // Seed default admin account: admin@nova.com / admin123
  const salt = generateSalt();
  const hash = hashPassword("admin123", salt);
  try {
    db.prepare(
      `INSERT INTO users (id, email, name, password_hash, salt, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(randomUUID(), "admin@nova.com", "Admin", hash, salt, "admin");
  } catch { /* already exists */ }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
type UserRow = { id: string; email: string; name: string; password_hash: string; salt: string; role: string };

export function getUserByEmail(email: string): UserRow | undefined {
  const d = initDb();
  return d.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim()) as UserRow | undefined;
}

export function getUserById(id: string): User | undefined {
  const d = initDb();
  const row = d.prepare("SELECT id, email, name, role FROM users WHERE id = ?").get(id) as { id: string; email: string; name: string; role: string } | undefined;
  if (!row) return undefined;
  return { id: row.id, email: row.email, name: row.name, role: row.role as "admin" | "customer" };
}

export function createUser(email: string, name: string, password: string): User {
  const d = initDb();
  const existing = getUserByEmail(email);
  if (existing) throw new Error("Email already registered");
  const id = randomUUID();
  const salt = generateSalt();
  const hash = hashPassword(password, salt);
  d.prepare(
    `INSERT INTO users (id, email, name, password_hash, salt, role) VALUES (?, ?, ?, ?, ?, 'customer')`,
  ).run(id, email.toLowerCase().trim(), name.trim(), hash, salt);
  return { id, email: email.toLowerCase().trim(), name: name.trim(), role: "customer" };
}

export function verifyPassword(email: string, password: string): User | null {
  const row = getUserByEmail(email);
  if (!row) return null;
  const hash = hashPassword(password, row.salt);
  if (hash !== row.password_hash) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role as "admin" | "customer" };
}

// ─── Sessions (now with user linking) ─────────────────────────────────────────
export function createSession(sessionId: string, userId?: string) {
  const d = initDb();
  d.prepare(`INSERT OR REPLACE INTO sessions (id, user_id) VALUES (?, ?)`).run(sessionId, userId ?? null);
}

export function linkSessionToUser(sessionId: string, userId: string) {
  const d = initDb();
  d.prepare("UPDATE sessions SET user_id = ? WHERE id = ?").run(userId, sessionId);
}

export function getUserFromSession(sessionId: string): User | undefined {
  const d = initDb();
  const row = d.prepare(
    `SELECT u.id, u.email, u.name, u.role FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ?`,
  ).get(sessionId) as { id: string; email: string; name: string; role: string } | undefined;
  if (!row) return undefined;
  return { id: row.id, email: row.email, name: row.name, role: row.role as "admin" | "customer" };
}

export function clearSessionUser(sessionId: string) {
  const d = initDb();
  d.prepare("UPDATE sessions SET user_id = NULL WHERE id = ?").run(sessionId);
}

// ─── Product row helpers ───────────────────────────────────────────────────────
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

// ─── Product reads ─────────────────────────────────────────────────────────────
export function getProductFeatures(productId: string): string[] {
  const d = initDb();
  const row = d.prepare("SELECT features FROM products WHERE id = ?").get(productId) as { features: string } | undefined;
  if (!row) return [];
  try { return JSON.parse(row.features) as string[]; } catch { return []; }
}

export function getAllProducts(): Product[] {
  const d = initDb();
  return (d.prepare("SELECT * FROM products ORDER BY featured DESC, name ASC").all() as ProductRow[]).map(rowToProduct);
}

export function getFeaturedProducts(): Product[] {
  const d = initDb();
  return (d.prepare("SELECT * FROM products WHERE featured = 1 ORDER BY name ASC").all() as ProductRow[]).map(rowToProduct);
}

export function getProduct(id: string): Product | undefined {
  const d = initDb();
  const row = d.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  return row ? rowToProduct(row) : undefined;
}

export function getCategories(): string[] {
  const d = initDb();
  return (d.prepare("SELECT name FROM categories ORDER BY name ASC").all() as { name: string }[]).map((r) => r.name);
}

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

export function getProductsByCategory(category: string): Product[] {
  const d = initDb();
  return (d.prepare("SELECT * FROM products WHERE category = ? ORDER BY name ASC").all(category) as ProductRow[]).map(rowToProduct);
}

// ─── Product mutations (admin) ─────────────────────────────────────────────────
export function adminCreateProduct(input: AdminProductInput): Product {
  const d = initDb();
  const id = slugify(input.name) + "-" + Date.now().toString(36);
  const gradients = [
    "from-violet-500 to-indigo-600", "from-sky-500 to-cyan-400",
    "from-fuchsia-500 to-pink-500", "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500", "from-red-500 to-rose-600",
  ];
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  d.prepare(`
    INSERT INTO products (id, name, tagline, description, price_cents, compare_at_cents,
      category, emoji, image, gradient, rating, reviews, stock, featured, features)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)
  `).run(
    id, input.name, input.tagline, input.description,
    Math.round(input.price * 100),
    input.compareAt ? Math.round(input.compareAt * 100) : null,
    input.category, input.emoji || "📦", input.image || "", gradient,
    input.stock, input.featured ? 1 : 0,
    JSON.stringify(input.features || []),
  );

  // Ensure category exists
  d.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run(input.category);

  return getProduct(id)!;
}

export function adminUpdateProduct(id: string, input: Partial<AdminProductInput>): Product | undefined {
  const d = initDb();
  const existing = d.prepare("SELECT * FROM products WHERE id = ?").get(id) as ProductRow | undefined;
  if (!existing) return undefined;

  d.prepare(`
    UPDATE products SET
      name = ?, tagline = ?, description = ?, price_cents = ?, compare_at_cents = ?,
      category = ?, emoji = ?, image = ?, stock = ?, featured = ?, features = ?
    WHERE id = ?
  `).run(
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
  );
  if (input.category) d.prepare("INSERT OR IGNORE INTO categories (name) VALUES (?)").run(input.category);
  return getProduct(id);
}

export function adminDeleteProduct(id: string): boolean {
  const d = initDb();
  const info = d.prepare("DELETE FROM products WHERE id = ?").run(id);
  return (info.changes as number) > 0;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────
export function getReviews(productId: string): Review[] {
  const d = initDb();
  return (d.prepare("SELECT * FROM reviews WHERE product_id = ? ORDER BY date DESC").all(productId) as Array<{
    author: string; rating: number; title: string; body: string; date: string; verified: number;
  }>).map((row) => ({
    author: row.author, rating: row.rating, title: row.title,
    body: row.body, date: row.date, verified: row.verified === 1,
  }));
}

// ─── Cart ──────────────────────────────────────────────────────────────────────
type CartRow = { product_id: string; quantity: number };

export function getCartItems(sessionId: string): CartItem[] {
  if (!sessionId) return [];
  const d = initDb();
  const rows = d.prepare(
    `SELECT c.product_id, c.quantity FROM cart_items c WHERE c.session_id = ? ORDER BY c.rowid ASC`,
  ).all(sessionId) as CartRow[];
  return rows
    .map((row) => ({ product: getProduct(row.product_id), quantity: row.quantity }))
    .filter((entry): entry is { product: Product; quantity: number } => Boolean(entry.product));
}

export function setCartItem(sessionId: string, productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) { removeCartItem(sessionId, productId); return getCartItems(sessionId); }
  const d = initDb();
  const product = getProduct(productId);
  if (!product) return getCartItems(sessionId);
  const capped = Math.min(quantity, product.stock);
  d.prepare(
    `INSERT INTO cart_items (session_id, product_id, quantity) VALUES (?, ?, ?)
     ON CONFLICT (session_id, product_id) DO UPDATE SET quantity = excluded.quantity`,
  ).run(sessionId, productId, capped);
  return getCartItems(sessionId);
}

export function removeCartItem(sessionId: string, productId: string): CartItem[] {
  const d = initDb();
  d.prepare("DELETE FROM cart_items WHERE session_id = ? AND product_id = ?").run(sessionId, productId);
  return getCartItems(sessionId);
}

export function clearCart(sessionId: string): CartItem[] {
  const d = initDb();
  d.prepare("DELETE FROM cart_items WHERE session_id = ?").run(sessionId);
  return [];
}

// ─── Wishlist ──────────────────────────────────────────────────────────────────
export function getWishlistIds(sessionId: string): string[] {
  if (!sessionId) return [];
  const d = initDb();
  return (d.prepare("SELECT product_id FROM wishlist WHERE session_id = ? ORDER BY created_at DESC").all(sessionId) as { product_id: string }[]).map((r) => r.product_id);
}

export function toggleWishlist(sessionId: string, productId: string): boolean {
  const d = initDb();
  const existing = d.prepare("SELECT 1 FROM wishlist WHERE session_id = ? AND product_id = ?").get(sessionId, productId);
  if (existing) {
    d.prepare("DELETE FROM wishlist WHERE session_id = ? AND product_id = ?").run(sessionId, productId);
    return false;
  }
  d.prepare("INSERT OR REPLACE INTO wishlist (session_id, product_id) VALUES (?, ?)").run(sessionId, productId);
  return true;
}

// ─── Recently viewed ───────────────────────────────────────────────────────────
export function recordRecentView(sessionId: string, productId: string) {
  if (!sessionId) return;
  const d = initDb();
  d.prepare(
    `INSERT INTO recently_viewed (session_id, product_id) VALUES (?, ?)
     ON CONFLICT (session_id, product_id) DO UPDATE SET viewed_at = datetime('now')`,
  ).run(sessionId, productId);
}

export function getRecentViews(sessionId: string, limit = 4): Product[] {
  if (!sessionId) return [];
  const d = initDb();
  return (d.prepare(
    `SELECT p.* FROM recently_viewed rv
     JOIN products p ON p.id = rv.product_id
     WHERE rv.session_id = ? ORDER BY rv.viewed_at DESC LIMIT ?`,
  ).all(sessionId, limit) as ProductRow[]).map(rowToProduct);
}

// ─── Orders ────────────────────────────────────────────────────────────────────
export function placeOrder(
  sessionId: string | null,
  input: OrderInput,
  items: CartItem[],
  subtotal: number,
  shipping: number,
  userId?: string,
): OrderConfirmation {
  // ── Server-side validation ──────────────────────────────────────────────────
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

  const d = initDb();

  // ── Re-fetch authoritative prices from DB (never trust client prices) ───────
  let authoritative_subtotal = 0;
  const resolvedItems: { id: string; name: string; priceCents: number; quantity: number }[] = [];

  for (const item of items) {
    const product = getProduct(item.product.id);
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

  const info = d.prepare(
    `INSERT INTO orders (session_id, user_id, order_number, full_name, email, address, city, zip,
      subtotal_cents, shipping_cents, tax_cents, total_cents, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')`,
  ).run(
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
  );
  const orderId = Number(info.lastInsertRowid);

  const insertItem = d.prepare(
    `INSERT INTO order_items (order_id, product_id, product_name, price_cents, quantity) VALUES (?, ?, ?, ?, ?)`,
  );
  let itemCount = 0;
  for (const item of resolvedItems) {
    insertItem.run(orderId, item.id, item.name, item.priceCents, item.quantity);
    itemCount += item.quantity;
  }

  if (sessionId) d.prepare("DELETE FROM cart_items WHERE session_id = ?").run(sessionId);

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

export function getOrdersByUser(userId: string): AdminOrderRow[] {
  const d = initDb();
  return d.prepare(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ? GROUP BY o.id ORDER BY o.created_at DESC`,
  ).all(userId) as AdminOrderRow[];
}

// ─── Admin queries ─────────────────────────────────────────────────────────────
export function adminGetAllOrders(limit = 100, offset = 0): AdminOrderRow[] {
  const d = initDb();
  return d.prepare(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
  ).all(limit, offset) as AdminOrderRow[];
}

export function adminGetOrderById(id: number): AdminOrderRow | undefined {
  const d = initDb();
  return d.prepare(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.id = ? GROUP BY o.id`,
  ).get(id) as AdminOrderRow | undefined;
}

export function adminUpdateOrderStatus(id: number, status: string): boolean {
  const d = initDb();
  const info = d.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);
  return (info.changes as number) > 0;
}

export function adminGetStats(): {
  totalProducts: number;
  totalOrders: number;
  totalRevenueCents: number;
  totalUsers: number;
  recentOrders: AdminOrderRow[];
} {
  const d = initDb();
  const totalProducts = (d.prepare("SELECT COUNT(*) AS c FROM products").get() as { c: number }).c;
  const totalOrders = (d.prepare("SELECT COUNT(*) AS c FROM orders").get() as { c: number }).c;
  const totalRevenueCents = (d.prepare("SELECT COALESCE(SUM(total_cents),0) AS c FROM orders").get() as { c: number }).c;
  const totalUsers = (d.prepare("SELECT COUNT(*) AS c FROM users").get() as { c: number }).c;
  const recentOrders = d.prepare(
    `SELECT o.*, GROUP_CONCAT(oi.product_name || ' ×' || oi.quantity, ', ') AS items_summary
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id ORDER BY o.created_at DESC LIMIT 5`,
  ).all() as AdminOrderRow[];
  return { totalProducts, totalOrders, totalRevenueCents, totalUsers, recentOrders };
}

// ─── Misc ──────────────────────────────────────────────────────────────────────
export function countProducts(): number {
  const d = initDb();
  return (d.prepare("SELECT COUNT(*) AS count FROM products").get() as { count: number }).count;
}

export function getDbPath() { return DB_PATH; }

export function resetDatabase() {
  const d = initDb();
  d.exec(`
    DELETE FROM order_items; DELETE FROM orders; DELETE FROM recently_viewed;
    DELETE FROM cart_items; DELETE FROM wishlist; DELETE FROM sessions;
    DELETE FROM reviews; DELETE FROM products; DELETE FROM categories;
  `);
  seed(d);
}
