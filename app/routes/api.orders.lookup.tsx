import type { Route } from "./+types/api.orders.lookup";
import * as db from "@/server/db";

// POST /api/orders/lookup — guest order tracking by number + email.
// Both must match; an order number alone is not enough to see an order.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { orderNumber?: string; email?: string };
  try {
    body = (await request.json()) as { orderNumber?: string; email?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderNumber = String(body.orderNumber ?? "").trim();
  const email = String(body.email ?? "").trim();
  if (!orderNumber || !email) {
    return Response.json({ error: "Enter both your order number and email" }, { status: 400 });
  }

  const order = await db.lookupOrder(orderNumber, email);
  if (!order) {
    return Response.json(
      { error: "No order matches that number and email. Check both and try again." },
      { status: 404 },
    );
  }

  return Response.json({ order });
}
