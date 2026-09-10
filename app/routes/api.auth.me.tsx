import type { Route } from "./+types/api.auth.me";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

export async function loader({ request }: Route.LoaderArgs) {
  const sessionId = await getSessionId(request);
  const user = db.getUserFromSession(sessionId);
  if (!user) return Response.json({ user: null });
  return Response.json({ user });
}
