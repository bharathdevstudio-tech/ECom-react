import type { Route } from "./+types/api.auth.register";
import { getOrCreateSession } from "@/server/session";
import * as db from "@/server/db";

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  const { sessionId, setCookie } = await getOrCreateSession(request);
  const headers = new Headers();
  if (setCookie) headers.set("Set-Cookie", setCookie);

  try {
    const body = (await request.json()) as { email: string; name: string; password: string };
    if (!body.email || !body.name || !body.password) {
      return Response.json({ error: "All fields required" }, { status: 400, headers });
    }
    if (body.password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400, headers });
    }
    const user = db.createUser(body.email, body.name, body.password);
    db.createSession(sessionId, user.id);
    db.linkSessionToUser(sessionId, user.id);
    return Response.json({ ok: true, user }, { headers });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    return Response.json({ error: msg }, { status: 400, headers });
  }
}
