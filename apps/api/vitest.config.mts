import { coverageConfigDefaults, defineConfig } from "vitest/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.test" });

// Configuration options: https://vitest.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": "/src",
      "@test": "/src/test",
    },
  },
  test: {
    // Configuration options: https://vitest.dev/config/#coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json", "html"],
      exclude: [
        "src/instrumentation.ts",
        "**/swagger-schemas.ts",
        "src/swagger/**",
        "src/test/**",
        ...coverageConfigDefaults.exclude,
      ],
    },
  },
});
