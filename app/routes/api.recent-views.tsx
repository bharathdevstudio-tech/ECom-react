import type { Route } from "./+types/api.recent-views";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

// GET /api/recent-views
export async function loader({ request }: Route.LoaderArgs) {
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const products = db.getRecentViews(sessionId, 8);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return Response.json(products, { headers });
}
