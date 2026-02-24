import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import onlyWarn from "eslint-plugin-only-warn";
import turboConfig from "eslint-config-turbo/flat";

export default tseslint.config(
  {
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      turboConfig,
    ],
    plugins: {
      "only-warn": onlyWarn,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: true,
      },
      globals: {
        React: true,
        JSX: true,
      },
    },
    ignores: ["**/node_modules/**", "**/dist/**"],
    // Disable type-aware linting for config files
    files: ["**/*.ts"],
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
