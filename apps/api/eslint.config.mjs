import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import turboConfig from 'eslint-config-turbo/flat';

export default [
  {
    ignores: ['node_modules/**', 'coverage/**', 'dist/**', 'playwright-report/**'],
  },
  ...tseslint.config(
    {
      extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        turboConfig,
      ],
      languageOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        parserOptions: {
          projectService: true,
        },
        globals: {
          AsyncGenerator: 'readonly',
          AsyncIterable: 'readonly',
          AsyncIterator: 'readonly',
        },
      },
      files: ['**/*.ts'],
    },
    {
      files: ['**/*.mjs'],
      extends: [tseslint.configs.disableTypeChecked],
    },
  ),
  {
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
