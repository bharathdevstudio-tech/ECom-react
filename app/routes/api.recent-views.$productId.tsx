import type { Route } from "./+types/api.recent-views.$productId";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

// POST /api/recent-views/:productId — record a product view
export async function action({ request, params }: Route.ActionArgs) {
  const { sessionId, setCookie } = await getOrCreateSession(request);
  db.recordRecentView(sessionId, params.productId);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);
  return Response.json({ ok: true }, { headers });
}
