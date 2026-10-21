import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [
    // `cloudflare()` runs the Worker entry (`workers/app.ts`) and builds it into
    // `build/server`. React Router is configured with the Vite Environment API
    // future flag (see react-router.config.ts) so its SSR build targets the
    // Cloudflare worker environment instead of a standalone Node server.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
});
