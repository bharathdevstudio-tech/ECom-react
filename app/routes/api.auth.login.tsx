import type { Route } from "./+types/api.auth.login";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);

  const body = (await request.json()) as { email: string; password: string };
  if (!body.email || !body.password) {
    return Response.json({ error: "Email and password required" }, { status: 400, headers });
  }

  const user = db.verifyPassword(body.email, body.password);
  if (!user) {
    return Response.json({ error: "Invalid email or password" }, { status: 401, headers });
  }

  db.createSession(sessionId, user.id);
  db.linkSessionToUser(sessionId, user.id);
  return Response.json({ ok: true, user }, { headers });
}
