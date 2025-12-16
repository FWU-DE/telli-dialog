import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@shared': path.resolve(__dirname, '../../packages/shared/src'),
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
