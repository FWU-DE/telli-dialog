import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { runCalculator } from './worker.js';
import type { Limits } from './types.js';

const limits: Limits = {
  maxExpressionLength: 20,
  maxBodyBytes: 100,
  maxOutputBytes: 100,
  wallTimeMs: 100,
  concurrency: 1,
};

function fakeSpawn(
  close: (child: EventEmitter & Record<string, unknown>) => void,
  calls?: { command: string; args: string[]; options: Record<string, unknown> },
) {
  return ((command: string, args: string[], options: Record<string, unknown>) => {
    if (calls) {
      calls.command = command;
      calls.args = args;
      calls.options = options;
    }
    const child = new EventEmitter() as EventEmitter & Record<string, unknown>;
    child.stdout = Object.assign(new EventEmitter(), { setEncoding() {} });
    child.stderr = new EventEmitter();
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
    expect(result).toEqual({
      status: 'upstream_failure',
      error: 'request cancelled',
    });
  });

  it('wins the cancellation race when the signal aborts immediately after spawn', async () => {
    const controller = new AbortController();
    let killed = 0;
    const resultPromise = runCalculator(
      '1',
      limits,
      fakeSpawn((child) => {
        child.kill = () => {
          killed += 1;
          queueMicrotask(() => child.emit('close', null, 'SIGKILL'));
          return true;
        };
        controller.abort();
      }),
      { signal: controller.signal },
    );

    await expect(resultPromise).resolves.toEqual({
      status: 'upstream_failure',
      error: 'request cancelled',
    });
    expect(killed).toBeLessThanOrEqual(2);
  });

  it('reports a timeout when the process does not exit', async () => {
    const result = await runCalculator(
      '1',
      { ...limits, wallTimeMs: 5 },
      fakeSpawn(() => {}),
    );
    expect(result.status).toBe('timeout');
  });

  it('passes the exact argv after the option terminator and never writes stdin', async () => {
    const calls = { command: '', args: [], options: {} } as {
      command: string;
      args: string[];
      options: Record<string, unknown>;
    };
    const result = await runCalculator(
      '-1 + 2',
      limits,
      fakeSpawn((child) => {
        queueMicrotask(() => {
          (child.stdout as EventEmitter).emit('data', '2\n');
          child.emit('close', 0, null);
        });
      }, calls),
    );

    expect(calls.command).toBe('qalc');
    expect(calls.args).toEqual([
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
    expect(calls.options.stdio).toEqual(['ignore', 'pipe', 'pipe']);
    expect(result).toEqual({ status: 'success', result: '2' });
  });

  it('consumes stderr without changing a successful result', async () => {
    const result = await runCalculator(
      '1',
      limits,
      fakeSpawn((child) => {
        queueMicrotask(() => {
          (child.stderr as EventEmitter).emit('data', 'qalc diagnostic\n');
          (child.stdout as EventEmitter).emit('data', '1\n');
          child.emit('close', 0, null);
        });
      }),
    );

    expect(result).toEqual({ status: 'success', result: '1' });
  });

  it('reports oversized stderr as a crashed worker', async () => {
    const result = await runCalculator(
      '1',
      limits,
      fakeSpawn((child) => {
        queueMicrotask(() => {
          (child.stderr as EventEmitter).emit('data', 'x'.repeat(limits.maxOutputBytes + 1));
          child.emit('close', 0, null);
        });
      }),
    );

    expect(result).toEqual({
      status: 'crashed_worker',
      error: 'qalc worker produced too much diagnostic output',
    });
  });

  it('gives oversized stdout precedence over oversized stderr', async () => {
    const result = await runCalculator(
      '1',
      limits,
      fakeSpawn((child) => {
        queueMicrotask(() => {
          (child.stdout as EventEmitter).emit('data', 'x'.repeat(limits.maxOutputBytes + 1));
          (child.stderr as EventEmitter).emit('data', 'y'.repeat(limits.maxOutputBytes + 1));
          child.emit('close', 0, null);
        });
      }),
    );

    expect(result).toEqual({ status: 'malformed_output', error: 'output too large' });
  });

  it('reports invalid input for a normal nonzero qalc exit', async () => {
    const result = await runCalculator(
      '1',
      limits,
      fakeSpawn((child) => queueMicrotask(() => child.emit('close', 1, null))),
    );
    expect(result).toEqual({
      status: 'invalid_input',
      error: 'qalc could not evaluate the expression',
    });
  });

  it('reports a crashed worker when qalc is terminated by a signal', async () => {
    const result = await runCalculator(
      '1',
      limits,
      fakeSpawn((child) => queueMicrotask(() => child.emit('close', null, 'SIGSEGV'))),
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
