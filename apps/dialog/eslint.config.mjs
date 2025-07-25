import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'next/core-web-vitals', 'next/typescript'],
    rules: {
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
    },
  }),
];

export default eslintConfig;
