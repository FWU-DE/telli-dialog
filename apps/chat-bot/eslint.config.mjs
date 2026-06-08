import nextJsConfig from '@ais-chat/eslint-config/nextjs';

const eslintConfig = [
  ...nextJsConfig,
  {
    settings: {
      linkComponents: [{ name: 'Link', linkAttribute: 'href' }],
    },
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
        {
          name: 'next-auth/jwt',
          importNames: ['getToken'],
          message: "Do not import 'getToken' from 'next-auth/jwt'. Use the auth() wrapper instead.",
        },
      ],
      'turbo/no-undeclared-env-vars': ['warn'],
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
    files: ['**/*.test.ts'],
  },
  {
    ignores: ['e2e/**/*.js'],
  },
];

export default eslintConfig;
