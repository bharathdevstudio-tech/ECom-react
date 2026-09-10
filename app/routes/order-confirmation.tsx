import type { Route } from "./+types/order-confirmation";
import OrderConfirmationView from "@/components/checkout/OrderConfirmationView";

export function meta(): Route.MetaDescriptors {
  return [
    { title: "Order confirmation — Nova Store" },
    { name: "description", content: "Your Nova Store order has been placed." },
  ];
}

export default function OrderConfirmationPage() {
  return <OrderConfirmationView />;
}
