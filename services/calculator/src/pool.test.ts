import { describe, expect, it } from 'vitest';
import { WorkerPool } from './pool.js';
import type { Limits } from './types.js';

const limits: Limits = {
  maxExpressionLength: 10,
  maxBodyBytes: 10,
  maxOutputBytes: 10,
  wallTimeMs: 10,
  concurrency: 1,
};

describe('worker pool', () => {
  it('rejects concurrent work rather than queueing it', async () => {
    const pool = new WorkerPool(limits, async () => new Promise(() => undefined));
    const first = pool.run('1');
    expect((await pool.run('2')).status).toBe('overload');
    first.catch(() => undefined);
  });

  it('returns a structured internal failure and releases a crashed slot', async () => {
    const failing = new WorkerPool(limits, async () => {
      throw new Error('crash');
    });
    expect((await failing.run('1')).status).toBe('internal_failure');
    expect((await failing.run('2')).status).toBe('internal_failure');
  });
});
