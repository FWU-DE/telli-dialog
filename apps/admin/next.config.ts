import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@telli/ui',
    '@telli/shared',
    'import-in-the-middle',
    '@t3-oss/env-nextjs',
    '@t3-oss/env-core',
  ],
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
};

export default nextConfig;
