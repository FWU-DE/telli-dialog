import { runQalc, type SpawnQalc } from './worker.js';
import type { Limits, Result, RunOptions } from './types.js';

export class WorkerPool {
  private active = 0;
  constructor(
    private readonly limits: Limits,
    private readonly runner = runQalc,
    private readonly spawnQalc?: SpawnQalc,
  ) {}

  run(expression: string, options: RunOptions = {}): Promise<Result> {
    if (this.active >= this.limits.concurrency)
      return Promise.resolve({ status: 'overload', error: 'worker pool is busy' });
    this.active += 1;
    const work = Promise.resolve().then(() =>
      this.spawnQalc
        ? this.runner(expression, this.limits, this.spawnQalc, options)
        : this.runner(expression, this.limits, undefined, options),
    );
    return work
      .catch((): Result => ({ status: 'internal_failure', error: 'worker failed' }))
      .finally(() => {
        this.active -= 1;
      });
  }
}
