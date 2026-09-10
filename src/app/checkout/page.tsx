import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Nova Store order.",
};

export default function CheckoutPage() {
  return (
    <div className="flex-1">
      <CheckoutView />
    </div>
  );
}