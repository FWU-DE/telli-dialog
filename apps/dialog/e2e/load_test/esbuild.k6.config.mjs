import { build } from 'esbuild';

build({
  entryPoints: ['e2e/load_test/*-test.ts'],
  bundle: true,
  platform: 'node',
  outdir: 'e2e/load_test',
  external: ['k6', 'k6/browser', 'fs', 'path', 'os', 'crypto'], // Prevents K6 & Node.js modules from being bundled
  logLevel: 'info',
}).catch(() => process.exit(1));
