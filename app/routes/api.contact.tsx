import type { Route } from "./+types/api.contact";
import * as db from "@/server/db";
import type { ContactMessageInput } from "@/lib/types";

// POST /api/contact — store a support message from the contact page.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let input: ContactMessageInput;
  try {
    input = (await request.json()) as ContactMessageInput;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await db.createContactMessage(input);
    return Response.json({ ok: true }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send your message";
    return Response.json({ error: message }, { status: 400 });
  }
}
