import type { Route } from "./+types/checkout";
import CheckoutView from "@/components/checkout/CheckoutView";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Checkout — Nova Store" },
    { name: "description", content: "Complete your Nova Store order." },
  ];
}

export default function CheckoutPage() {
  return (
    <div className="flex-1">
      <CheckoutView />
    </div>
  );
}
