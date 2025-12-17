import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import turboConfig from 'eslint-config-turbo/flat';
import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  js.configs.recommended,
  ...turboConfig,
  ...compat.config({
    extends: ['prettier'],
    plugins: ['prettier'],
    rules: {
      'prettier/prettier': 'error',
      'turbo/no-undeclared-env-vars': ['warn'],
      eqeqeq: ['error', 'always'],
    },
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        Buffer: 'readonly',
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        fetch: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'prettier/prettier': 'error',
      'turbo/no-undeclared-env-vars': ['warn'],
      eqeqeq: ['error', 'always'],
    },
  },
];

export default eslintConfig;
