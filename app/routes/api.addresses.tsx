import type { Route } from "./+types/api.addresses";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";
import type { AddressInput } from "@/lib/types";

async function currentUser(request: Request) {
  const sessionId = await getSessionId(request);
  return db.getUserFromSession(sessionId);
}

// GET /api/addresses — the signed-in customer's saved addresses.
export async function loader({ request }: Route.LoaderArgs) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const addresses = await db.getAddresses(user.id);
  return Response.json({ addresses });
}

// POST /api/addresses — create a saved address.
export async function action({ request }: Route.ActionArgs) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let input: AddressInput;
  try {
    input = (await request.json()) as AddressInput;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const address = await db.createAddress(user.id, input);
    return Response.json({ ok: true, address }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save address";
    return Response.json({ error: message }, { status: 400 });
  }
}
