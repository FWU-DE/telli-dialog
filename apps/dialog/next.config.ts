import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';

const baseNextConfig: NextConfig = {
  typescript: {
    // should be checked in the pipeline anyway and takes a lot of time during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // should be checked in the pipeline anyway and takes a lot of time during build
    ignoreDuringBuilds: true,
  },
  // if you do not host it on vercel for serverless environment enable this option
  // if you want to host it on vercel, remove this option
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sentry.logging.eu-de.prod.telli.schule; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://sentry.logging.eu-de.prod.telli.schule https://telli-development.obs.eu-nl.otc.t-systems.com https://telli-staging.obs.eu-nl.otc.t-systems.com https://telli-production.obs.eu-nl.otc.t-systems.com; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
  images: {
    dangerouslyAllowSVG: false, // Changed from true to false for security
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'telli-development.obs.eu-nl.otc.t-systems.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'telli-staging.obs.eu-nl.otc.t-systems.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'telli-production.obs.eu-nl.otc.t-systems.com',
        port: '',
      },
    ],
  },
  productionBrowserSourceMaps: process.env.NODE_ENV !== 'test',
  allowedDevOrigins: ['titanom.ngrok.app'],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  webpack: (config, { isServer }) => {
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
    setCommits: {
      auto: true,
      ignoreEmpty: true,
      ignoreMissing: true,
    },
  },

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  // widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  tunnelRoute: '/monitoring',
  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,
});
