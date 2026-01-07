import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import next from 'eslint-config-next';
import nextTypescript from 'eslint-config-next/typescript';
// https://nextjs.org/docs/app/api-reference/config/eslint#specifying-a-root-directory-within-a-monorepo
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...nextCoreWebVitals,
  ...next,
  ...nextTypescript,
  ...compat.config({
    extends: ['prettier'],
    plugins: ['prettier'],

    settings: {
      next: {
        rootDir: 'apps/admin/',
      },
    },
  }),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
