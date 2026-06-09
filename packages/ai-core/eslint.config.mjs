import baseConfig from '@ais-chat/eslint-config/base';

export default [
  ...baseConfig,
  {
    rules: {
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
    },
  },
];
