import type { Route } from "./+types/api.orders";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";
import type { CartItem, OrderInput } from "@/lib/types";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const { sessionId, setCookie } = await getOrCreateSession(request);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);

  let body: { input: OrderInput; items: CartItem[] };
  try {
    body = (await request.json()) as { input: OrderInput; items: CartItem[] };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400, headers });
  }

  const { input, items } = body;

  // Basic field presence check (full validation happens inside placeOrder)
  if (!input?.fullName?.trim() || !input?.email?.trim() ||
      !input?.address?.trim() || !input?.city?.trim() || !input?.zip?.trim()) {
    return Response.json({ error: "All shipping fields are required" }, { status: 400, headers });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Cart is empty" }, { status: 400, headers });
  }

  const user = db.getUserFromSession(sessionId);

  try {
    // placeOrder re-fetches all prices from DB, recomputes tax/shipping/total
    const confirmation = db.placeOrder(sessionId, input, items, 0, 0, user?.id);
    return Response.json(confirmation, { headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Order failed";
    return Response.json({ error: message }, { status: 400, headers });
  }
}
