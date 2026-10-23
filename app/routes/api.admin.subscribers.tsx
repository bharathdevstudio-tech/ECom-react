import type { Route } from "./+types/api.admin.subscribers";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/subscribers
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const subscribers = await db.adminGetSubscribers();
  return Response.json({ subscribers });
}

// DELETE /api/admin/subscribers?id=123
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request.method !== "DELETE") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const id = Number(new URL(request.url).searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid subscriber" }, { status: 400 });
  }

  const ok = await db.adminDeleteSubscriber(id);
  if (!ok) return Response.json({ error: "Subscriber not found" }, { status: 404 });
  return Response.json({ ok: true });
}
