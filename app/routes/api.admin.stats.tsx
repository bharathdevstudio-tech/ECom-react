import type { Route } from "./+types/api.admin.stats";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return Response.json(await db.adminGetStats());
}
