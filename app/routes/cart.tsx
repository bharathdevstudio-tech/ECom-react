import type { Route } from "./+types/cart";
import CartView from "@/components/cart/CartView";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Cart — Nova Store" },
    { name: "description", content: "Review the items in your Nova Store cart." },
  ];
}

export default function CartPage() {
  return <CartView />;
}
