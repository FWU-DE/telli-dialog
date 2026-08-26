import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { runCalculator } from './worker.js';
import type { Limits } from './types.js';

const limits: Limits = {
  maxExpressionLength: 20,
  maxBodyBytes: 100,
  maxOutputBytes: 100,
  wallTimeMs: 5,
  concurrency: 1,
};

function fakeSpawn(
  close: (child: EventEmitter & Record<string, unknown>) => void,
  args?: string[],
) {
  return ((_: string, actualArgs: string[]) => {
    args?.push(...actualArgs);
    const child = new EventEmitter() as EventEmitter & Record<string, unknown>;
    child.stdout = Object.assign(new EventEmitter(), { setEncoding() {} });
    child.kill = () => {
      queueMicrotask(() => child.emit('close', null, 'SIGKILL'));
      return true;
    };
    close(child);
    return child;
  }) as never;
}

describe('qalc worker lifecycle', () => {
  it('does not spawn qalc for an already cancelled request', async () => {
    const controller = new AbortController();
    controller.abort();
    let spawned = false;

    const result = await runCalculator(
      '1',
      limits,
      (() => {
        spawned = true;
      }) as never,
      { signal: controller.signal },
    );

    expect(spawned).toBe(false);
    expect(result).toEqual({ status: 'upstream_failure', error: 'request cancelled' });
  });

  it('reports a timeout when the process does not exit', async () => {
    const result = await runCalculator(
      '1',
      limits,
      fakeSpawn(() => {}),
    );
    expect(result.status).toBe('timeout');
  });

  it('passes one expression after the option terminator and never writes stdin', async () => {
    const args: string[] = [];
    const result = await runCalculator(
      '-1 + 2',
      { ...limits, wallTimeMs: 100 },
      fakeSpawn((child) => {
        queueMicrotask(() => {
          (child.stdout as EventEmitter).emit('data', '2\n');
          child.emit('close', 0, null);
        });
      }, args),
    );
    expect(args).toEqual([
      '--terse',
      '-s',
      'approximation exact',
      '-s',
      'color false',
      '-s',
      'unicode false',
      '-s',
      'save mode no',
      '-s',
      'save definitions no',
      '-s',
      'update exchange rates 0',
      '--',
      '-1 + 2',
    ]);
    expect(result).toEqual({ status: 'success', result: '2' });
  });

  it('reports invalid input for a normal nonzero qalc exit', async () => {
    const result = await runCalculator(
      '1',
      { ...limits, wallTimeMs: 100 },
      fakeSpawn((child) => {
        queueMicrotask(() => child.emit('close', 1, null));
      }),
    );
    expect(result).toEqual({
      status: 'invalid_input',
      error: 'qalc could not evaluate the expression',
    });
  });

  it('reports a crashed worker when qalc is terminated by a signal', async () => {
    const result = await runCalculator(
      '1',
      { ...limits, wallTimeMs: 100 },
      fakeSpawn((child) => {
        queueMicrotask(() => child.emit('close', null, 'SIGSEGV'));
      }),
    );
    expect(result.status).toBe('crashed_worker');
  });

  it('does not expose spawn errors', async () => {
    const result = await runCalculator('1', limits, (() => {
      throw new Error('/secret/path: permission denied');
    }) as never);
    expect(result).toEqual({ status: 'upstream_failure', error: 'qalc unavailable' });
  });
});
