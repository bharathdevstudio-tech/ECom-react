import type { Route } from "./+types/api.wishlist";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

// GET /api/wishlist
export async function loader({ request }: Route.LoaderArgs) {
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const ids = db.getWishlistIds(sessionId);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return Response.json(ids, { headers });
}
