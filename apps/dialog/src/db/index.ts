import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import path from 'node:path';

const globalPool = global as unknown as {
  pool?: Pool;
};

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Database URL undefined');
}

const pool =
  globalPool.pool ??
  new Pool({
    connectionString,
    max: 12,
  });

// In development mode, store the pool globally to reuse it across hot reloads.
if (process.env.NODE_ENV === 'development') {
  globalPool.pool = pool;
}
const db = drizzle({ client: pool });

await migrate(db, {
  migrationsFolder: path.join(process.cwd(), 'migrations'),
});

export { db };
