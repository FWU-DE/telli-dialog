import base from "@telli/api-eslint-config/server.js";

export default [
  ...base,
  {
    rules: {
      "no-inner-declarations": "off",
      "no-constant-condition": "off",
      "@typescript-eslint/unbound-method": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
    files: ["**/*.test.ts"],
  },
];
