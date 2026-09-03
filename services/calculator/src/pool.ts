import { runCalculator, type SpawnCalculator } from './worker.js';
import type { Limits, Result, RunOptions } from './types.js';

export class WorkerPool {
  private active = 0;

  constructor(
    private readonly limits: Limits,
    private readonly runner = runCalculator,
    private readonly spawnCalculator?: SpawnCalculator,
  ) {}

  run(expression: string, options: RunOptions = {}): Promise<Result> {
    if (this.active >= this.limits.concurrency) {
      // Reject rather than queue excess work, keeping latency and resource use bounded.
      return Promise.resolve({ status: 'overload', error: 'worker pool is busy' });
    }
    this.active += 1;
    const work = Promise.resolve().then(() =>
      this.runner(expression, this.limits, this.spawnCalculator, options),
    );
    return work
      .catch((): Result => ({ status: 'internal_failure', error: 'worker failed' }))
      .finally(() => {
        this.active -= 1;
      });
  }
}
