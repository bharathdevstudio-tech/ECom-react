export type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  category: string;
  emoji: string;
  image: string;
  gradient: string;
  rating: number;
  reviews: number;
  stock: number;
  featured: boolean;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type Review = {
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
};

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

export type OrderInput = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  zip: string;
};

export type OrderConfirmation = {
  orderNumber: string;
  fullName: string;
  email: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  itemCount: number;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type User = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
};

export type AuthResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

// ─── Admin ────────────────────────────────────────────────────────────────────
export type AdminProductInput = {
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAt?: number;
  category: string;
  emoji?: string;
  image?: string;
  stock: number;
  featured: boolean;
  features?: string[];
};

export type AdminOrderRow = {
  id: number;
  session_id: string | null;
  user_id: string | null;
  order_number: string;
  full_name: string;
  email: string;
  address: string;
  city: string;
  zip: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  items_summary: string | null;
};
