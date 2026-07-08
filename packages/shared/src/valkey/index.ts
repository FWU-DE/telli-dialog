import { createStorage } from 'unstorage';
import redisDriver, { RedisOptions } from 'unstorage/drivers/redis';
import { env } from '@shared/valkey/env';

// 1 second timeout to ensure AIS.chat remains available even if valkey is unreachable
const COMMAND_TIMEOUT_MS = 1_000;
const BASE_KEY_PREFIX = 'ais-chat:app';

function getClusterDriverOptions(valkeyUrl: string): RedisOptions {
  const url = new URL(valkeyUrl);
  return {
    cluster: [
      // Only the entry node is needed; ioredis discovers the rest of the cluster via CLUSTER SLOTS.
      { host: url.hostname, port: Number(url.port) || 6379 },
    ],
    clusterOptions: {
      redisOptions: {
        commandTimeout: COMMAND_TIMEOUT_MS,
      },
    },
    base: BASE_KEY_PREFIX,
  };
}

export const valkey = createStorage({
  driver: redisDriver(
    env.valkeyMode === 'cluster'
      ? getClusterDriverOptions(env.valkeyUrl)
      : {
          url: env.valkeyUrl,
          base: BASE_KEY_PREFIX,
          commandTimeout: COMMAND_TIMEOUT_MS,
        },
  ),
});
