# @ais-chat/eslint-config

Shared ESLint configurations for all packages and apps in the ais-chat monorepo.

## Exports

### `./base`

ESLint configuration for pure TypeScript/Node.js packages.

### `./nextjs`

ESLint configuration for Next.js apps and React packages.

## Usage

### Minimal setup - Using base config in a Node.js package

```javascript
// eslint.config.mjs
import baseConfig from '@ais-chat/eslint-config/base';

export default [...baseConfig];
```

### Minimal setup - Using nextjs config in a Next.js app

```javascript
// eslint.config.mjs
import nextJsConfig from '@ais-chat/eslint-config/nextjs';

export default [...nextJsConfig];
```

### With app-specific settings

For Next.js apps, you may need to configure the Next.js root directory:

```javascript
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
];
```

### With additional app-specific ignores

If your app has additional paths to ignore beyond the defaults:

```javascript
import nextJsConfig from '@ais-chat/eslint-config/nextjs';

export default [
  ...nextJsConfig,
  {
    ignores: ['custom-dir/**'],
  },
];
```

### With rule overrides

Override individual rules as needed:

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
