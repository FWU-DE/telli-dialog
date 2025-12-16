import { runDatabaseMigration } from '@shared/db';

/**
 * Custom code that will be executed on application startup.
 */
export async function startup() {
  await runDatabaseMigration();
}
