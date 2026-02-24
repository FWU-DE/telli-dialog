import { config } from "dotenv";
import path from "node:path";

// Unlike Next.js (dialog/admin), Fastify does not auto-load .env files.
// This must be imported before any other module that reads process.env.
// In production, environment variables are provided by the runtime (e.g. Docker).
if (process.env.NODE_ENV !== "production") {
  config({ path: path.resolve(import.meta.dirname, "..", ".env.local") });
}
