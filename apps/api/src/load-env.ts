import { config } from 'dotenv';
import path from 'node:path';

// Unlike Next.js (dialog/admin), Fastify does not auto-load .env files.
// This must be imported before any other module that reads process.env.
// In production, environment variables are provided by the runtime (e.g. Docker).
if (process.env.NODE_ENV !== 'production') {
  config({ path: path.resolve(import.meta.dirname, '..', '.env.local') });
}

// Default API_DATABASE_URL to DATABASE_URL so operators only need to configure
// one variable when both point to the same database.
if (!process.env.API_DATABASE_URL && process.env.DATABASE_URL) {
  process.env.API_DATABASE_URL = process.env.DATABASE_URL;
}
