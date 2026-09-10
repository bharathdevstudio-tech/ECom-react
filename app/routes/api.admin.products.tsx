import type { Route } from "./+types/api.admin.products";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";
import type { AdminProductInput } from "@/lib/types";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/products — list all (with features)
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const products = db.getAllProducts();
  return Response.json({ products });
}

// POST /api/admin/products — create
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  const input = (await request.json()) as AdminProductInput;
  if (!input.name || !input.category || input.price == null) {
    return Response.json({ error: "name, category and price are required" }, { status: 400 });
  }

  const product = db.adminCreateProduct(input);
  return Response.json({ ok: true, product }, { status: 201 });
}
