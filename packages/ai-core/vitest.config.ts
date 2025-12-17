import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],

    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],

    environment: 'node',

    testTimeout: 5000,

    env: {
      NODE_ENV: 'test',
    },

    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    },
  },
});
