import { build } from 'esbuild';

build({
  entryPoints: ['e2e/load_test/run.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'e2e/load_test/run.js',
  external: ['k6', 'k6/browser', 'fs', 'path', 'os', 'crypto'], // Prevents K6 & Node.js modules from being bundled
  logLevel: 'info',
}).catch(() => process.exit(1));
