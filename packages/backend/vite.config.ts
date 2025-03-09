import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    minify: false,
    rollupOptions: {
      external: ['express', 'cors'],
    },
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/index.ts',
      exportName: 'app',
      tsCompiler: 'esbuild',
    }),
  ],
  optimizeDeps: {
    exclude: ['fsevents'],
  },
});
