import { createRequestHandler } from "react-router";

// Cloudflare Workers entry point.
//
// `react-router build` emits `build/server/index.js` as a module namespace
// (the server build), which `createRequestHandler` turns into a fetch handler.
// We import it lazily through Vite's SSR build graph so the bundle stays
// tree-shakeable, and we pass the Worker's `env`/`ctx` as the load context so
// route loaders and actions can reach bindings (D1, assets, ...).
import * as serverBuild from "virtual:react-router/server-build";

const handler = createRequestHandler(serverBuild, "production");

export default {
  async fetch(request, env, ctx) {
    return handler(request, { cloudflare: { env, ctx } });
  },
} satisfies ExportedHandler;
