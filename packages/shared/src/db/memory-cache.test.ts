import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryCache } from './memory-cache';

describe('Memory Cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return undefined on cache miss', async () => {
    const cache = new MemoryCache();
    const result = await cache.get('non-existent-key');
    expect(result).toBeUndefined();
  });

  it('should return the cached value', async () => {
    const cache = new MemoryCache();
    const key = 'test-key';
    const value = { name: 'Test' };

    await cache.put(key, value, [], false);
    const result = await cache.get(key);

    expect(result).toEqual(value);
  });

  it('should return undefined when the cached value expired (global ttl)', async () => {
    // Set TTL to 1 second
    const cache = new MemoryCache({ ex: 1 });
    const key = 'expiring-key';
    const value = { name: 'Expired' };

    await cache.put(key, value, [], false);

    // Advance time by 1.1 seconds
    vi.advanceTimersByTime(1100);

    const result = await cache.get(key);
    expect(result).toBeUndefined();
  });

  it('should return undefined when the cached value expired (ttl set by item)', async () => {
    // Set global TTL to 2 seconds
    const cache = new MemoryCache({ ex: 2 });
    const key = 'expiring-key';
    const value = { name: 'Expired' };

    // Set TTL to 1 second
    await cache.put(key, value, [], false, { ex: 1 });

    // Advance time by 1.1 seconds
    vi.advanceTimersByTime(1100);

    const result = await cache.get(key);
    expect(result).toBeUndefined();
  });
});
