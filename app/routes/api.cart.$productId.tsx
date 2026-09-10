import type { Route } from "./+types/api.cart.$productId";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

// PUT /api/cart/:productId — add/update item quantity
// DELETE /api/cart/:productId — remove item
export async function action({ request, params }: Route.ActionArgs) {
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const { productId } = params;
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);

  if (request.method === "DELETE") {
    const items = db.removeCartItem(sessionId, productId);
    return Response.json(items, { headers });
  }

  if (request.method === "PUT") {
    let body: { quantity?: unknown };
    try {
      body = (await request.json()) as { quantity?: unknown };
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400, headers });
    }

    const raw = body.quantity;
    const quantity = typeof raw === "number" ? Math.floor(raw) : parseInt(String(raw ?? ""), 10);

    if (isNaN(quantity) || quantity < 0) {
      return Response.json({ error: "quantity must be a non-negative integer" }, { status: 400, headers });
    }

    const items = db.setCartItem(sessionId, productId, quantity);
    return Response.json(items, { headers });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405, headers });
}
