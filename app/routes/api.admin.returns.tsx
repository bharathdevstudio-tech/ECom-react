import type { Route } from "./+types/api.admin.returns";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";
import type { ReturnStatus } from "@/lib/types";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/returns
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const returns = await db.adminGetReturns();
  return Response.json({ returns });
}

// PATCH /api/admin/returns — { id, status, note? }
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request.method !== "PATCH") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { id?: number; status?: ReturnStatus; note?: string };
  try {
    body = (await request.json()) as { id?: number; status?: ReturnStatus; note?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Number.isInteger(body.id) || !body.status) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const returnRequest = await db.adminUpdateReturnStatus(body.id!, body.status, body.note);
    return Response.json({ ok: true, returnRequest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update the return";
    return Response.json({ error: message }, { status: 400 });
  }
}
