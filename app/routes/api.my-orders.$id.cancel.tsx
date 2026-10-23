import type { Route } from "./+types/api.my-orders.$id.cancel";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

// POST /api/my-orders/:id/cancel — customer cancellation before shipping.
export async function action({ request, params }: Route.ActionArgs) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid order" }, { status: 400 });
  }

  try {
    const order = await db.cancelOrderByUser(user.id, id);
    return Response.json({ ok: true, order });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not cancel this order";
    return Response.json({ error: message }, { status: 400 });
  }
}
