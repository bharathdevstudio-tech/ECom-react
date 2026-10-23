import type { Route } from "./+types/api.profile";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

// GET /api/profile — the signed-in customer's profile plus order/review stats.
export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.getUserProfile(user.id);
  if (!profile) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ profile });
}

// PATCH /api/profile — update name and email.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "PATCH") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string; email?: string };
  try {
    body = (await request.json()) as { name?: string; email?: string };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const updated = await db.updateUserProfile(user.id, body);
    return Response.json({ ok: true, user: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update profile";
    return Response.json({ error: message }, { status: 400 });
  }
}
