import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl === undefined) {
  throw Error("Expected process.env.DATABASE_URL to be defined");
}

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: "postgresql",
  verbose: true,
  strict: true,
});
