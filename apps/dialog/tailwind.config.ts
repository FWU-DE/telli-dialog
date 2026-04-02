import type { Config } from 'tailwindcss';
import baseConfig from '@telli/ui/tailwind.config';

const config = {
  ...baseConfig,
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
} satisfies Config;

export default config;
