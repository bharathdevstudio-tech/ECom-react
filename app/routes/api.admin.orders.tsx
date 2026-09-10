import type { Route } from "./+types/api.admin.orders";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/orders
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? 100);
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const orders = db.adminGetAllOrders(limit, offset);
  return Response.json({ orders });
}

// PATCH /api/admin/orders — update status { id, status }
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (request.method !== "PATCH") return Response.json({ error: "Method not allowed" }, { status: 405 });
  const { id, status } = (await request.json()) as { id: number; status: string };
  const valid = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  const ok = db.adminUpdateOrderStatus(id, status);
  if (!ok) return Response.json({ error: "Order not found" }, { status: 404 });
  return Response.json({ ok: true });
}
