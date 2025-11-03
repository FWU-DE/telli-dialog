import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import path from 'node:path';
import { env } from '../env';
import { migrateWithLock } from './migrate';

const globalState = global as unknown as {
  pool?: Pool;
  migrationsRun?: boolean;
};

const pool =
  globalState.pool ??
  new Pool({
    connectionString: env.databaseUrl,
    max: 12,
  });

// In development mode, store the pool globally to reuse it across hot reloads.
if (process.env.NODE_ENV === 'development') {
  globalState.pool = pool;
}
const db = drizzle({ client: pool });

// Ensure the migrations are executed only once
// Note: migrations won't be run on hot reload
if (!globalState.migrationsRun) {
  globalState.migrationsRun = true;

  // cannot use `await` at the top level in a module, so we use an IIFE
  (async () => {
    try {
      console.info('Running database migrations...');
      await migrateWithLock(db, {
        migrationsFolder: path.join(process.cwd(), '..', '..', 'packages', 'shared', 'migrations'),
      });
      console.info('Database migrations completed successfully.');
    } catch (error) {
      console.error('Error running database migrations:', error);
    }
  })();
}

export { db };
