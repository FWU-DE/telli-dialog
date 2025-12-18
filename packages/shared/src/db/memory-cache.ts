import { Cache, MutationOption } from 'drizzle-orm/cache/core';
import { CacheConfig } from 'drizzle-orm/cache/core/types';
import { entityKind } from 'drizzle-orm/entity';

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
    config?: CacheConfig,
    private readonly useGlobally?: boolean,
  ) {
    super();
    this.ttlSeconds = config?.ex ?? 1;
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
    const ttlSeconds = config?.ex ?? this.ttlSeconds;
    const now = new Date().getTime();

    const expireTimestamp = now + ttlSeconds * 1000;
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
