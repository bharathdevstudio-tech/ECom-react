import type { Route } from "./+types/api.addresses.$id";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";
import type { AddressInput } from "@/lib/types";

async function currentUser(request: Request) {
  const sessionId = await getSessionId(request);
  return db.getUserFromSession(sessionId);
}

// PATCH /api/addresses/:id — update an address or make it the default.
// DELETE /api/addresses/:id — remove an address.
export async function action({ request, params }: Route.ActionArgs) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const id = params.id;
  if (!id) return Response.json({ error: "Invalid address" }, { status: 400 });

  if (request.method === "DELETE") {
    const ok = await db.deleteAddress(user.id, id);
    if (!ok) return Response.json({ error: "Address not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (request.method !== "PATCH") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let input: Partial<AddressInput>;
  try {
    input = (await request.json()) as Partial<AddressInput>;
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Making an address the default is a one-field shortcut.
  if (input.isDefault === true && Object.keys(input).length === 1) {
    const ok = await db.setDefaultAddress(user.id, id);
    if (!ok) return Response.json({ error: "Address not found" }, { status: 404 });
    const addresses = await db.getAddresses(user.id);
    return Response.json({ ok: true, addresses });
  }

  try {
    const address = await db.updateAddress(user.id, id, input);
    return Response.json({ ok: true, address });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update address";
    return Response.json({ error: message }, { status: 400 });
  }
}
