import { mergeConfig } from 'vite';
import { defineConfig } from 'vitest/config';
import base from './vite.config';

export default mergeConfig(
  base,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
    },
  })
);
