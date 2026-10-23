import type { Route } from "./+types/api.coupons.validate";
import * as db from "@/server/db";
import type { CouponValidation } from "@/lib/types";

// POST /api/coupons/validate — preview a promo code against the cart subtotal.
// The order endpoint re-validates authoritatively, so this is display only.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: { code?: string; subtotal?: number };
  try {
    body = (await request.json()) as { code?: string; subtotal?: number };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const subtotal = Number(body.subtotal ?? 0);
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return Response.json({ error: "Invalid subtotal" }, { status: 400 });
  }

  const result = await db.validateCoupon(String(body.code ?? ""), Math.round(subtotal * 100));

  if (!result.ok) {
    const payload: CouponValidation = { ok: false, error: result.error };
    return Response.json(payload, { status: 400 });
  }

  const payload: CouponValidation = {
    ok: true,
    code: result.code,
    discount: result.discountCents / 100,
    label: result.label,
  };
  return Response.json(payload);
}
