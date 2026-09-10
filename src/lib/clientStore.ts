"use client";

type Listener = () => void;

type StoreState<T> = {
  snapshot: T;
  listeners: Set<Listener>;
};

function getStoreState<T>(globalKey: string, initial: T): StoreState<T> {
  const g = globalThis as unknown as Record<string, StoreState<T>>;
  if (!g[globalKey]) {
    g[globalKey] = { snapshot: initial, listeners: new Set() };
  }
  return g[globalKey];
}

/**
 * A tiny external store that survives Fast Refresh and module
 * duplication by living on `globalThis`, plus a stable snapshot
 * for use with `useSyncExternalStore`. All mutable state is kept
 * out of the component tree so it is safe against SSR/hydration.
 */
export function createBrowserStore<T>(globalKey: string, initial: T) {
  const state = getStoreState(globalKey, initial);

  return {
    getServerSnapshot: () => initial,
    getSnapshot: () => state.snapshot,
    subscribe: (listener: Listener) => {
      state.listeners.add(listener);
      return () => {
        state.listeners.delete(listener);
      };
    },
    set: (updater: (prev: T) => T) => {
      state.snapshot = updater(state.snapshot);
      for (const listener of state.listeners) listener();
    },
    replace: (value: T) => {
      state.snapshot = value;
      for (const listener of state.listeners) listener();
    },
    get: () => state.snapshot,
  };
}