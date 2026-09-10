import type { Route } from "./+types/api.cart";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

// GET /api/cart
export async function loader({ request }: Route.LoaderArgs) {
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const items = db.getCartItems(sessionId);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return Response.json(items, { headers });
}

// DELETE /api/cart — clear cart
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const items = db.clearCart(sessionId);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return Response.json(items, { headers });
}
