import { defineConfig } from 'tsup';
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin';

const isDevBuild = process.env.NODE_ENV !== 'production';

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  splitting: false,
  clean: true,
  // externalize all imports at runtime so OTel can patch them.
  external: [/.*/],
  // Important:
  // We bundle all workspace packages (e.g. @telli/*) into the API bundle.
  // Any third‑party modules imported from those packages must therefore be
  // resolvable from the API's runtime node_modules (not from packages/*/node_modules),
  // otherwise Node will fail at runtime.
  noExternal: [
    /@telli\//,
    /^@\//,
    /^\./,
    // injected by Sentry plugin; must be bundled or Node will try to require it at runtime
    /_sentry.*injection-stub$/,
  ],
  esbuildPlugins: [
    sentryEsbuildPlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      url: process.env.SENTRY_URL,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      debug: true,
      release: {
        create: !isDevBuild,
        setCommits: {
          auto: true,
          ignoreEmpty: true,
          ignoreMissing: true,
        },
      },

      // Only print logs for uploading source maps in CI
      silent: !process.env.CI,

      sourcemaps: {
        disable: isDevBuild,
        assets: './dist/*',
      },
    }),
  ],
});
