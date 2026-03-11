import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.API_DATABASE_URL;

if (databaseUrl === undefined) {
  throw Error('Expected process.env.API_DATABASE_URL to be defined');
}

export default defineConfig({
  schema: './src/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: 'postgresql',
  verbose: true,
  strict: true,
});
