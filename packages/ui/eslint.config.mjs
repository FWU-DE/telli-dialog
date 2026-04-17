import next from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import turboConfig from 'eslint-config-turbo/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { FlatCompat } from '@eslint/eslintrc';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...turboConfig,
  ...compat.config({
    extends: ['prettier'],
    plugins: ['prettier'],

    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  }),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
