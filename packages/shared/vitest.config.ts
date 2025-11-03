import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@/': '/src/',
    },
  },
  test: {
    include: ['**/*.{test,spec}.{js,ts,jsx,tsx}'],

    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],

    environment: 'node',

    testTimeout: 5000,

    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    },
  },
});
