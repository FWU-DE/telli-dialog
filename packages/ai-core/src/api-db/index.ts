import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '../env';

const connectionString = env.apiDatabaseUrl;

const pool = new Pool({
  connectionString,
  max: 12,
});

export const dbApi = drizzle({ client: pool });

export * from './schema';
