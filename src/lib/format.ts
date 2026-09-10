import type { Product } from "@/lib/types";

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(price);
}

export function getDiscountPercent(product: Product): number | null {
  if (!product.compareAt || product.compareAt <= product.price) return null;
  return Math.round((1 - product.price / product.compareAt) * 100);
}