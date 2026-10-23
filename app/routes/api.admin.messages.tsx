import type { Route } from "./+types/api.admin.messages";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/messages
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await db.adminGetContactMessages();
  return Response.json({ messages });
}

// PATCH /api/admin/messages — { id, status: "new" | "read" }
// DELETE /api/admin/messages — ?id=123
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (request.method === "DELETE") {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid message" }, { status: 400 });
    }
    const ok = await db.adminDeleteContactMessage(id);
    if (!ok) return Response.json({ error: "Message not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (request.method !== "PATCH") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { id?: number; status?: "new" | "read" };
  try {
    body = (await request.json()) as { id?: number; status?: "new" | "read" };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!Number.isInteger(body.id) || (body.status !== "new" && body.status !== "read")) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const ok = await db.adminUpdateContactMessage(body.id!, body.status);
    if (!ok) return Response.json({ error: "Message not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update message";
    return Response.json({ error: message }, { status: 400 });
  }
}
