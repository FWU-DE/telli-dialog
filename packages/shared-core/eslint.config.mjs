import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import turboConfig from 'eslint-config-turbo/flat';

export default tseslint.config(
  {
    extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, turboConfig],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
    },
    ignores: ['**/node_modules/**', '**/dist/**'],
    files: ['**/*.ts'],
  },
  {
    files: ['**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
