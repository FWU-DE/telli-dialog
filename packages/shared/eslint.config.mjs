import nextJsConfig from '@ais-chat/eslint-config/nextjs';

const eslintConfig = [
  ...nextJsConfig,
  {
    ignores: ['node_modules/**', 'out/**', 'build/**', 'coverage/**'],
  },
];

export default eslintConfig;
