import type { Route } from "./+types/wishlist";
import { getAllProducts } from "@/server/db";
import WishlistContent from "@/components/wishlist/WishlistContent";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Wishlist — Nova Store" },
    { name: "description", content: "Products you saved for later at Nova Store." },
  ];
}

export async function loader() {
  const products = getAllProducts();
  return { products };
}

export default function WishlistPage({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex-1">
      <WishlistContent products={loaderData.products} />
    </div>
  );
}
