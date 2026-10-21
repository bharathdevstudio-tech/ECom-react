import type { Config } from "@react-router/dev/config";

export default {
  // Server-side rendering enabled (so loaders can access the D1/SQLite storage).
  ssr: true,
  future: {
    // Required by `@cloudflare/vite-plugin`: routes the SSR build through Vite's
    // Environment API (`ssr` environment) instead of emitting a Node server.
    v8_viteEnvironmentApi: true,
  },
} satisfies Config;
