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
  /** Set when the review was written by a signed-in customer. */
  userId?: string;
};

export type ReviewInput = {
  rating: number;
  title: string;
  body: string;
};

// ─── Coupons ──────────────────────────────────────────────────────────────────
export type CouponType = "percent" | "fixed";

export type Coupon = {
  code: string;
  type: CouponType;
  /** Percent points (1–100) for `percent`, or cents for `fixed`. */
  value: number;
  minSubtotalCents: number;
  maxUses: number | null;
  uses: number;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
};

export type CouponInput = {
  code: string;
  type: CouponType;
  value: number;
  /** Minimum order subtotal in dollars. */
  minSubtotal?: number;
  maxUses?: number | null;
  expiresAt?: string | null;
  active?: boolean;
};

export type CouponValidation =
  | { ok: true; code: string; discount: number; label: string }
  | { ok: false; error: string };

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
  /** Discount applied by a promo code, in dollars. */
  discount: number;
  couponCode?: string;
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

export type UserProfile = User & {
  createdAt: string;
  stats: {
    orders: number;
    totalSpentCents: number;
    reviews: number;
  };
};

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
  discount_cents?: number;
  coupon_code?: string | null;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  status: string;
  created_at: string;
  items_summary: string | null;
};
