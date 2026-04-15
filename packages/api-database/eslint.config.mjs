import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import turboConfig from 'eslint-config-turbo/flat';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, turboConfig],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
    },
    files: ['**/*.ts'],
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
