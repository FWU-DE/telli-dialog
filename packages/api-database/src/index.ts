import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from './env';

const globalState = global as unknown as {
  apiDbPool?: Pool;
};

const pool =
  globalState.apiDbPool ??
  new Pool({
    connectionString: env.databaseUrl,
    max: 12,
  });

// In development mode, store the pool globally to reuse it across hot reloads.
if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
  globalState.apiDbPool = pool;
}

export const db = drizzle({ client: pool });

export * from './schema';
export * from './functions';
export * from './types';
export * from './migrate';
