import next from 'eslint-config-next';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import turboConfig from 'eslint-config-turbo/flat';

const eslintConfig = [
  ...next,
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...turboConfig,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];

export default eslintConfig;
