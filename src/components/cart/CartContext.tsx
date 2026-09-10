import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "@/lib/types";
import { createBrowserStore } from "@/lib/clientStore";

const cartStore = createBrowserStore<CartItem[]>("__nova_cart_store__", []);

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

async function refreshFromServer() {
  try {
    const res = await fetch("/api/cart");
    if (res.ok) {
      const items = (await res.json()) as CartItem[];
      cartStore.replace(items);
    }
  } catch {
    // Keep current in-memory state if the server request fails.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  useEffect(() => {
    refreshFromServer();
  }, []);

  useEffect(() => {
    const sync = () => refreshFromServer();
    window.addEventListener("storage", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  const addItem = useCallback((product: Product, quantity = 1) => {
    cartStore.set((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      return existing
        ? prev.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
              : item,
          )
        : [...prev, { product, quantity: Math.min(quantity, product.stock) }];
    });

    const currentQty =
      cartStore.get().find((i) => i.product.id === product.id)?.quantity ?? quantity;

    fetch(`/api/cart/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: currentQty }),
    })
      .then((r) => r.json())
      .then((items) => cartStore.replace(items as CartItem[]))
      .catch(refreshFromServer);
  }, []);

  const removeItem = useCallback((productId: string) => {
    cartStore.set((prev) => prev.filter((item) => item.product.id !== productId));
    fetch(`/api/cart/${productId}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((items) => cartStore.replace(items as CartItem[]))
      .catch(refreshFromServer);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    cartStore.set((prev) =>
      quantity <= 0
        ? prev.filter((item) => item.product.id !== productId)
        : prev.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          ),
    );
    if (quantity <= 0) {
      fetch(`/api/cart/${productId}`, { method: "DELETE" })
        .then((r) => r.json())
        .then((items) => cartStore.replace(items as CartItem[]))
        .catch(refreshFromServer);
    } else {
      fetch(`/api/cart/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      })
        .then((r) => r.json())
        .then((items) => cartStore.replace(items as CartItem[]))
        .catch(refreshFromServer);
    }
  }, []);

  const clearCart = useCallback(() => {
    cartStore.set(() => []);
    fetch("/api/cart", { method: "DELETE" })
      .then((r) => r.json())
      .then((items) => cartStore.replace(items as CartItem[]))
      .catch(refreshFromServer);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    return { items, count, subtotal, addItem, removeItem, updateQuantity, clearCart };
  }, [items, addItem, removeItem, updateQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
