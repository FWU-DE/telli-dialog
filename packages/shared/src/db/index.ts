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

// cannot use `await` at the top level in a module, so we use an IIFE
(async () => {
  try {
    console.info('Running database migrations...');
    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), '..', '..', 'packages', 'shared', 'migrations'),
    });
    console.info('Database migrations completed successfully.');
  } catch (error) {
    console.error('Error running database migrations:', error);
  }
})();

export { db };
