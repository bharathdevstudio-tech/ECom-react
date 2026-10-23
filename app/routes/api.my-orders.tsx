import type { Route } from "./+types/api.my-orders";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [orders, returns] = await Promise.all([
    db.getOrdersByUser(user.id),
    db.getReturnsByUser(user.id),
  ]);
  return Response.json({ orders, returns });
}
