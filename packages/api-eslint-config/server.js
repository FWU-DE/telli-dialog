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
      globals: {
        AsyncGenerator: 'readonly',
        AsyncIterable: 'readonly',
        AsyncIterator: 'readonly',
      },
    },
    // Disable type-aware linting for config files
    files: ['**/*.ts'],
  },
  {
    files: ['**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
