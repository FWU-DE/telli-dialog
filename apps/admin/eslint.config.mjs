import nextJsConfig from '@ais-chat/eslint-config/nextjs';

const eslintConfig = [
  ...nextJsConfig,
  {
    settings: {
      next: {
        rootDir: 'apps/admin/',
      },
    },
  },
  {
    rules: {
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
