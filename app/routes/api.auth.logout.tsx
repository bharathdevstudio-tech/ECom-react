import type { Route } from "./+types/api.auth.logout";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const sessionId = await getSessionId(request);
  db.clearSessionUser(sessionId);
  // Expire the session cookie in the browser
  return Response.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": "nova-session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0",
      },
    },
  );
}
