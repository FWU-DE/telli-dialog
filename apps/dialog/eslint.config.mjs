import next from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import turboConfig from 'eslint-config-turbo/flat';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...turboConfig,
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...compat.config({
    extends: ['prettier'],
    plugins: ['prettier'],

    rules: {
      'prettier/prettier': 'error',
      'turbo/no-undeclared-env-vars': ['warn'],
      'no-restricted-imports': [
        'error',
        {
          name: '@ai-sdk/ui-utils',
          importNames: ['Message'],
          message: "Please import Message directly from '@ai' instead.",
        },
        {
          name: '@ai-sdk/react',
          importNames: ['Message'],
          message: "Please import Message directly from '@ai' instead.",
        },
        {
          name: '@ai-sdk/ui-utils',
          importNames: ['UIMessage'],
          message: "Please import UIMessage directly from '@ai' instead.",
        },
        {
          name: 'next-auth/jwt',
          importNames: ['getToken'],
          message: "Do not import 'getToken' from 'next-auth/jwt'. Use the auth() wrapper instead.",
        },
      ],
      eqeqeq: ['error', 'always'],
    },
  }),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
    files: ['**/*.test.ts'],
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'e2e/**/*.js'],
  },
];

export default eslintConfig;
