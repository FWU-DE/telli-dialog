import baseConfig from '@ais-chat/eslint-config/base';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  ...baseConfig,
];
