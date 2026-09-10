import type { Metadata } from "next";
import { getAllProducts } from "@/server/db";
import WishlistContent from "@/components/wishlist/WishlistContent";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you saved for later at Nova Store.",
};

export default function WishlistPage() {
  const products = getAllProducts();

  return (
    <div className="flex-1">
      <WishlistContent products={products} />
    </div>
  );
}