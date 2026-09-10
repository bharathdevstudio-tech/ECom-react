import type { Metadata } from "next";
import OrderConfirmationView from "@/components/checkout/OrderConfirmationView";

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "Your Nova Store order has been placed.",
};

export default function OrderConfirmationPage() {
  return <OrderConfirmationView />;
}