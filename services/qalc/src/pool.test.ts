import { describe, expect, it } from 'vitest';
import { WorkerPool } from './pool.js';
import { runQalc } from './worker.js';
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
    const pool = new WorkerPool(limits);
    const first = pool.run('1');
    expect((await pool.run('2')).status).toBe('overload');
    await first;
  });

  it('returns a structured internal failure and releases a crashed slot', async () => {
    const runner = async () => {
      throw new Error('crash');
    };
    const pool = new WorkerPool(limits, runner as typeof runQalc);
    expect((await pool.run('1')).status).toBe('internal_failure');
    expect((await pool.run('2')).status).toBe('internal_failure');
  });
});
