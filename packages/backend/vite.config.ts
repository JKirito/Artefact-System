import { defineConfig } from "vite";
import { VitePluginNode } from "vite-plugin-node";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3002, // Changed from 3001 to avoid port conflict
    middlewareMode: true,
    hmr: false,
  },
  build: {
    outDir: "dist",
    minify: true,
    rollupOptions: {
      external: ["express", "cors"],
    },
  },
  plugins: [
    ...VitePluginNode({
      adapter: "express",
      appPath: "./src/index.ts",
      exportName: "app",
      tsCompiler: "esbuild",
    }),
  ],
  optimizeDeps: {
    exclude: ["fsevents"],
  },
});
