import type { Route } from "./+types/api.my-orders";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = await getSessionId(request);
  const user = db.getUserFromSession(sessionId);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const orders = db.getOrdersByUser(user.id);
  return Response.json({ orders });
}
