import type { Route } from "./+types/api.profile.password";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

// POST /api/profile/password — change the signed-in customer's password.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string; confirmPassword?: string };
  try {
    body = (await request.json()) as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");
  const confirmPassword = String(body.confirmPassword ?? "");

  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Fill in all password fields" }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return Response.json({ error: "New passwords do not match" }, { status: 400 });
  }

  try {
    await db.changePassword(user.id, currentPassword, newPassword);
    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not change password";
    return Response.json({ error: message }, { status: 400 });
  }
}
