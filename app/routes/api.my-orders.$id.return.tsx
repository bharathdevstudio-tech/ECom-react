import type { Route } from "./+types/api.my-orders.$id.return";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

// POST /api/my-orders/:id/return — request a return for a delivered order.
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

  let body: { reason?: unknown; details?: unknown };
  try {
    body = (await request.json()) as { reason?: unknown; details?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.reason !== "string") {
    return Response.json({ error: "Choose a reason for the return" }, { status: 400 });
  }

  try {
    const returnRequest = await db.requestOrderReturn(
      user.id,
      id,
      body.reason,
      typeof body.details === "string" ? body.details : "",
    );
    return Response.json({ ok: true, returnRequest }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not request a return";
    return Response.json({ error: message }, { status: 400 });
  }
}
