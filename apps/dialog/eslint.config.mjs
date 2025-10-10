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
  ...compat.config({
    extends: ['next', 'next/core-web-vitals', 'next/typescript', 'prettier'],
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
      ],
      eqeqeq: ['error', 'always'],
    },
  }),
];

export default eslintConfig;
