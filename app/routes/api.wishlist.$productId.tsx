import type { Route } from "./+types/api.wishlist.$productId";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

// POST /api/wishlist/:productId — toggle wishlist item
export async function action({ request, params }: Route.ActionArgs) {
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);
  const added = db.toggleWishlist(sessionId, params.productId);
  const ids = db.getWishlistIds(sessionId);
  return Response.json({ ids, added }, { headers });
}
