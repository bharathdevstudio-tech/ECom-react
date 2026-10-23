import type { Route } from "./+types/api.admin.coupons";
import { getSessionId } from "@/server/session";
import * as db from "@/server/db";
import type { CouponInput } from "@/lib/types";

async function requireAdmin(request: Request) {
  const sessionId = await getSessionId(request);
  const user = await db.getUserFromSession(sessionId);
  if (!user || user.role !== "admin") return null;
  return user;
}

// GET /api/admin/coupons — list coupons
export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json({ coupons: await db.listCoupons() });
}

// POST create · PATCH activate/deactivate · DELETE remove
export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (request.method === "POST") {
    try {
      const body = (await request.json()) as CouponInput;
      const coupon = await db.createCoupon(body);
      return Response.json({ ok: true, coupon }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create coupon";
      return Response.json({ error: message }, { status: 400 });
    }
  }

  if (request.method === "PATCH") {
    let body: { code?: string; active?: boolean };
    try {
      body = (await request.json()) as { code?: string; active?: boolean };
    } catch {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!body.code) return Response.json({ error: "Missing coupon code" }, { status: 400 });
    const updated = await db.setCouponActive(body.code, Boolean(body.active));
    if (!updated) return Response.json({ error: "Coupon not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  if (request.method === "DELETE") {
    const code = new URL(request.url).searchParams.get("code") ?? "";
    if (!code) return Response.json({ error: "Missing coupon code" }, { status: 400 });
    const deleted = await db.deleteCoupon(code);
    if (!deleted) return Response.json({ error: "Coupon not found" }, { status: 404 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
