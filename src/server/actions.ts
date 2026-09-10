"use server";

import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { CartItem, OrderConfirmation, OrderInput } from "@/lib/types";
import * as db from "@/server/db";

const SESSION_COOKIE = "nova-session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (existing) return existing;

  const sessionId = randomUUID();
  cookieStore.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return sessionId;
}

export async function getCartAction(): Promise<CartItem[]> {
  return db.getCartItems(await getSessionId());
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<CartItem[]> {
  return db.setCartItem(await getSessionId(), productId, quantity);
}

export async function updateCartQuantityAction(
  productId: string,
  quantity: number,
): Promise<CartItem[]> {
  return db.setCartItem(await getSessionId(), productId, quantity);
}

export async function removeCartItemAction(
  productId: string,
): Promise<CartItem[]> {
  return db.removeCartItem(await getSessionId(), productId);
}

export async function clearCartAction(): Promise<CartItem[]> {
  return db.clearCart(await getSessionId());
}

export async function getWishlistAction(): Promise<string[]> {
  return db.getWishlistIds(await getSessionId());
}

export async function toggleWishlistAction(
  productId: string,
): Promise<{ ids: string[]; added: boolean }> {
  const sessionId = await getSessionId();
  const added = db.toggleWishlist(sessionId, productId);
  return { ids: db.getWishlistIds(sessionId), added };
}

export async function getRecentViewsAction(): Promise<import("@/lib/types").Product[]> {
  return db.getRecentViews(await getSessionId(), 8);
}

export async function recordRecentViewAction(productId: string) {
  db.recordRecentView(await getSessionId(), productId);
}

export async function placeOrderAction(
  input: OrderInput,
  items: CartItem[],
  subtotal: number,
  shipping: number,
): Promise<OrderConfirmation> {
  const sessionId = await getSessionId();
  return db.placeOrder(sessionId, input, items, subtotal, shipping);
}