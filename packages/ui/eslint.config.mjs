import nextJsConfig from '@ais-chat/eslint-config/nextjs';

const eslintConfig = [
  ...nextJsConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
