import { createStorage } from 'unstorage';
import redisDriver from 'unstorage/drivers/redis';
import { env } from '@shared/valkey/env';

export const valkey = createStorage({
  driver: redisDriver({
    url: env.valkeyUrl,
    base: 'telli:dialog',
    // 1 second timeout to ensure telli remains available even if valkey is unreachable
    commandTimeout: 1_000,
  }),
});
