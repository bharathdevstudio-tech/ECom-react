import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createBrowserStore } from "@/lib/clientStore";

const wishlistStore = createBrowserStore<string[]>("__nova_wishlist_store__", []);

type WishlistContextValue = {
  ids: string[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => boolean;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const ids = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot,
  );

  useEffect(() => {
    fetch("/api/wishlist")
      .then((r) => r.json())
      .then((data: string[]) => {
        if (JSON.stringify(data) !== JSON.stringify(wishlistStore.get())) {
          wishlistStore.replace(data);
        }
      })
      .catch(() => {
        // Keep current state if the request fails.
      });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  const toggleWishlist = useCallback((productId: string) => {
    let added = false;
    wishlistStore.set((prev) => {
      added = !prev.includes(productId);
      return added ? [...prev, productId] : prev.filter((id) => id !== productId);
    });

    fetch(`/api/wishlist/${productId}`, { method: "POST" })
      .then((r) => r.json())
      .then((result: { ids: string[]; added: boolean }) =>
        wishlistStore.replace(result.ids),
      )
      .catch(() => {
        // Revert optimistic toggle on failure.
        wishlistStore.replace(
          added
            ? wishlistStore.get().filter((id) => id !== productId)
            : [...wishlistStore.get(), productId],
        );
      });

    return added;
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({ ids, count: ids.length, isWishlisted, toggleWishlist }),
    [ids, isWishlisted, toggleWishlist],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
