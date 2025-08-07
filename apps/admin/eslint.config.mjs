// https://nextjs.org/docs/app/api-reference/config/eslint#specifying-a-root-directory-within-a-monorepo
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ['next', 'next/typescript', 'prettier'],
    plugins: ['prettier'],
    settings: {
      next: {
        rootDir: 'apps/admin/',
      },
    },
  }),
];

export default eslintConfig;
