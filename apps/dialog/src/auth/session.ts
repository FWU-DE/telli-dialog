import { createStorage } from 'unstorage';
import redisDriver from 'unstorage/drivers/redis';

const storage = createStorage({
  driver: redisDriver({
    base: 'telli:dialog',
    host: 'localhost',
    port: 6379,
  }),
});

const SESSION_PREFIX = 'telli:dialog:session:';

/** create a new session with fixed expiration time to prevent stale data */
export async function createSession(sessionId: string) {
  storage.setItem(SESSION_PREFIX + sessionId, true, { ttl: 60 * 60 * 8 }); // 8 hours
}

/** check if a session exists */
export async function doesSessionExist(sessionId: string) {
  return storage.hasItem(SESSION_PREFIX + sessionId);
}

/** delete a session */
export async function deleteSession(sessionId: string) {
  return storage.removeItem(SESSION_PREFIX + sessionId);
}
