import type { Route } from "./+types/api.admin.customers";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/customers
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const customers = await db.adminGetCustomers();
  return Response.json({ customers });
}
