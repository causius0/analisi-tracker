import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest config for server-side tests (no React/DOM dependencies needed)
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['server/**/*.test.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 10000,
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@server': path.resolve(__dirname, './server'),
    },
  },
});
