// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./frontend", import.meta.url)),
      },
    },
  },
  tanstackStart: {
    // Frontend source lives alongside the standalone backend service.
    srcDirectory: "frontend",
    // Redirect TanStack Start's bundled server entry to frontend/server.ts.
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
