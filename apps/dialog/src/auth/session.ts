import { env } from '@/env';
import { createStorage } from 'unstorage';
import redisDriver from 'unstorage/drivers/redis';

const storage = createStorage({
  driver: redisDriver({
    url: env.valkeyUrl,
    base: 'telli:dialog',
  }),
});

const SESSION_PREFIX = 'telli:dialog:session:';
const TIME_TO_LIVE_SECONDS = 60 * 60 * 24; // remove blocklist items automatically after 24 hours

/** List of outdated sessions because user logged out elsewhere. */
export const sessionBlockList = {
  add: async (sessionId: string) => {
    await storage.setItem(SESSION_PREFIX + sessionId, true, { ttl: TIME_TO_LIVE_SECONDS });
  },
  has: async (sessionId: string) => {
    return storage.hasItem(SESSION_PREFIX + sessionId);
  },
};
