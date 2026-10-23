import type { Route } from "./+types/api.admin.questions";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/questions
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const questions = await db.adminGetQuestions();
  return Response.json({ questions });
}

// PATCH /api/admin/questions — { id, answer }
// DELETE /api/admin/questions?id=123
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (request.method === "DELETE") {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!Number.isInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid question" }, { status: 400 });
    }
    const ok = await db.adminDeleteQuestion(id);
    if (!ok) return Response.json({ error: "Question not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (request.method !== "PATCH") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { id?: number; answer?: string };
  try {
    body = (await request.json()) as { id?: number; answer?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!Number.isInteger(body.id) || typeof body.answer !== "string") {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const ok = await db.adminAnswerQuestion(body.id!, body.answer);
    if (!ok) return Response.json({ error: "Question not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save the answer";
    return Response.json({ error: message }, { status: 400 });
  }
}
