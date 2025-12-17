import { logError } from '@shared/logging';
import { valkey } from '@shared/valkey';

const SESSION_PREFIX = 'telli:dialog:session:';
const TIME_TO_LIVE_SECONDS = 60 * 60 * 24; // remove blocklist items automatically after 24 hours

/** List of outdated sessions because user logged out elsewhere. */
export const sessionBlockList = {
  add: async (sessionId: string) => {
    await valkey.setItem(SESSION_PREFIX + sessionId, true, { ttl: TIME_TO_LIVE_SECONDS });
  },
  has: async (sessionId: string) => {
    try {
      return await valkey.hasItem(SESSION_PREFIX + sessionId);
    } catch (error) {
      logError('Failed to check for session logout, allowing login', error);
      return false;
    }
  },
};
