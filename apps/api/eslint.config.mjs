import baseConfig from '@ais-chat/eslint-config/base';

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        AsyncGenerator: 'readonly',
        AsyncIterable: 'readonly',
        AsyncIterator: 'readonly',
      },
    },
    rules: {
      'no-inner-declarations': 'off',
      'no-constant-condition': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
    files: ['**/*.test.ts'],
  },
];
