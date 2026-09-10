import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Public pages
  index("routes/home.tsx"),
  route("products", "routes/products.tsx"),
  route("products/:id", "routes/product.tsx"),
  route("cart", "routes/cart.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("order-confirmation", "routes/order-confirmation.tsx"),
  route("wishlist", "routes/wishlist.tsx"),

  // Auth pages
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("my-orders", "routes/my-orders.tsx"),

  // Admin (layout + nested)
  layout("routes/admin.tsx", [
    route("admin", "routes/admin._index.tsx"),
    route("admin/products", "routes/admin.products.tsx"),
    route("admin/orders", "routes/admin.orders.tsx"),
  ]),

  // Customer API
  route("api/cart", "routes/api.cart.tsx"),
  route("api/cart/:productId", "routes/api.cart.$productId.tsx"),
  route("api/wishlist", "routes/api.wishlist.tsx"),
  route("api/wishlist/:productId", "routes/api.wishlist.$productId.tsx"),
  route("api/recent-views", "routes/api.recent-views.tsx"),
  route("api/recent-views/:productId", "routes/api.recent-views.$productId.tsx"),
  route("api/orders", "routes/api.orders.tsx"),
  route("api/my-orders", "routes/api.my-orders.tsx"),

  // Auth API
  route("api/auth/register", "routes/api.auth.register.tsx"),
  route("api/auth/login", "routes/api.auth.login.tsx"),
  route("api/auth/logout", "routes/api.auth.logout.tsx"),
  route("api/auth/me", "routes/api.auth.me.tsx"),

  // Admin API
  route("api/admin/stats", "routes/api.admin.stats.tsx"),
  route("api/admin/products", "routes/api.admin.products.tsx"),
  route("api/admin/products/:id", "routes/api.admin.products.$id.tsx"),
  route("api/admin/orders", "routes/api.admin.orders.tsx"),

  // 404 — must be last
  route("*", "routes/404.tsx"),
] satisfies RouteConfig;
