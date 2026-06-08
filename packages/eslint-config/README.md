# @ais-chat/eslint-config

Shared ESLint configurations for all packages and apps in the ais-chat monorepo.

## Exports

### `./base`

ESLint configuration for pure TypeScript/Node.js packages.

### `./nextjs`

ESLint configuration for Next.js apps and React packages.

## Usage

### Example: Using base config in a Node.js package

```javascript
// eslint.config.mjs
import baseConfig from '@ais-chat/eslint-config/base';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**'],
  },
  ...baseConfig,
];
```

### Example: Using nextjs config in a Next.js app

```javascript
// eslint.config.mjs
import nextJsConfig from '@ais-chat/eslint-config/nextjs';

export default [
  ...nextJsConfig,
  {
    settings: {
      next: {
        rootDir: 'apps/my-app/',
      },
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**'],
  },
];
```

## App-Specific Overrides

Individual apps/packages can override rules as needed. For example:

```javascript
import nextJsConfig from '@ais-chat/eslint-config/nextjs';

export default [
  ...nextJsConfig,
  {
    rules: {
      'my-custom-rule': 'off',
    },
  },
];
```
