import type { Route } from "./+types/api.newsletter";
import * as db from "@/server/db";

// POST /api/newsletter — subscribe an email address.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { email?: unknown };
  try {
    body = (await request.json()) as { email?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof body.email !== "string" || !body.email.trim()) {
    return Response.json({ error: "Enter your email address" }, { status: 400 });
  }

  try {
    const result = await db.subscribeNewsletter(body.email);
    return Response.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not subscribe";
    return Response.json({ error: message }, { status: 400 });
  }
}
