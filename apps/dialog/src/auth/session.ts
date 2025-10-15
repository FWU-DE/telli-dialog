import { logDebug } from '@/utils/logging/logging';
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

export async function storeSession(sessionId: string) {
  logDebug('storeSession: ' + sessionId);
  storage.setItem(SESSION_PREFIX + sessionId, true, { ttl: 60 * 60 * 8 }); // 8 hours
}

export async function doesSessionExist(sessionId: string) {
  logDebug('doesSessionExist: ' + sessionId);
  return storage.hasItem(SESSION_PREFIX + sessionId);
}

export async function deleteSession(sessionId: string) {
  logDebug('deleteSession: ' + sessionId);
  return storage.removeItem(SESSION_PREFIX + sessionId);
}
