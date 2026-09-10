import type { Route } from "./+types/api.admin.products.$id";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";
import type { AdminProductInput } from "@/lib/types";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// PUT /api/admin/products/:id — update
// DELETE /api/admin/products/:id — delete
export async function action({ request, params }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  if (request.method === "DELETE") {
    const ok = db.adminDeleteProduct(id);
    if (!ok) return Response.json({ error: "Product not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (request.method === "PUT" || request.method === "PATCH") {
    const input = (await request.json()) as Partial<AdminProductInput>;
    const product = db.adminUpdateProduct(id, input);
    if (!product) return Response.json({ error: "Product not found" }, { status: 404 });
    return Response.json({ ok: true, product });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
