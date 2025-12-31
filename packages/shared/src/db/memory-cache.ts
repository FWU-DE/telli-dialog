import { Cache, MutationOption } from 'drizzle-orm/cache/core';
import { CacheConfig } from 'drizzle-orm/cache/core/types';
import { entityKind } from 'drizzle-orm/entity';

/**
 * A drizzle cache provider for caching values in memory.
 * This provider should only be used for infrequently updated tables, where eventual consistency is sufficient.
 *
 *  Note:
 *  - this provider supports only the expiry time, see `CacheConfig.ex` and `CacheConfig.px`
 *  - it does not support auto-invalidation on db updates, as invalidation of
 *    local caches in a horizontally scaled application does not provide any benefit
 */
export class MemoryCache extends Cache {
  static override readonly [entityKind]: string = 'MemoryCache';

  private readonly ttlSeconds: number;

  private readonly cache = new Map<
    string,
    {
      expireTimestamp: number;
      // any is required for Cache interface of drizzle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: any;
    }
  >();

  constructor(
    config: Required<Pick<CacheConfig, 'ex'>>,
    private readonly useGlobally?: boolean,
  ) {
    super();
    this.ttlSeconds = config.ex;
  }

  public strategy() {
    return this.useGlobally ? 'all' : 'explicit';
  }

  override get(key: string): Promise<unknown[] | undefined> {
    let entry = this.cache.get(key);
    const now = new Date().getTime();
    if (entry && entry.expireTimestamp < now) {
      this.cache.delete(key);
      entry = undefined;
    }

    if (entry && entry.value) {
      return Promise.resolve(entry.value);
    }

    return Promise.resolve(undefined);
  }

  override async put(
    key: string,
    response: unknown,
    tables: string[],
    isTag: boolean,
    config?: CacheConfig,
  ): Promise<void> {
    const ttlMilliseconds = config?.px ?? (config?.ex ? config.ex : this.ttlSeconds) * 1000;
    const now = new Date().getTime();

    const expireTimestamp = now + ttlMilliseconds;
    this.cache.set(key, { value: response, expireTimestamp });
  }

  override async onMutate(params: MutationOption) {
    const tags: string[] = Array.isArray(params.tags)
      ? params.tags
      : params.tags
        ? [params.tags]
        : [];
    tags.forEach(this.cache.delete);
  }
}
