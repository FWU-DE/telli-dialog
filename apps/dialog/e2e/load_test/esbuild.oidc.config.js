const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['e2e/vidis-mock-server.ts'],
    bundle: true,
    platform: 'node',
    outfile: 'e2e/vidis-mock-server.js',
    logLevel: 'info',
  })
  .catch(() => process.exit(1));
