import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const isDevBuild = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development';

const baseNextConfig: NextConfig = {
  transpilePackages: [
    '@telli/ui',
    '@telli/shared',
    '@telli/ai-core',
    'import-in-the-middle',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],
  typescript: {
    // should be checked in the pipeline anyway and takes a lot of time during build
    ignoreBuildErrors: true,
  },
  // if you do not host it on vercel for serverless environment enable this option
  // if you want to host it on vercel, remove this option
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',
  images: {
    // When images are hosted on the same cloud as the application, access is routed on the local network and needs to be allowed
    dangerouslyAllowLocalIP: true,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: `${process.env.OTC_BUCKET_NAME}.${process.env.OTC_S3_HOSTNAME}`,
        port: '',
      },
    ],
  },
  productionBrowserSourceMaps: !isDevBuild,
  experimental: {
    useCache: true,
  },
  webpack: (config) => {
    // Ensure proper module resolution for path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
} satisfies NextConfig;

const withNextIntl = createNextIntlPlugin();

const baseNextConfigWithNextIntl = withNextIntl(baseNextConfig);

export default withSentryConfig(baseNextConfigWithNextIntl, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  sentryUrl: 'https://sentry.logging.eu-de.prod.telli.schule',
  authToken: process.env.SENTRY_AUTH_TOKEN,
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
  },

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  // widenClientFileUpload: true,

  webpack: {
    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
