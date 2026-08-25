import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import { runQalc } from './worker.js';
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
    child.stderr = Object.assign(new EventEmitter(), { setEncoding() {} });
    child.kill = () => {
      queueMicrotask(() => child.emit('close', null, 'SIGKILL'));
      return true;
    };
    close(child);
    return child;
  }) as never;
}

describe('qalc worker lifecycle', () => {
  it('reports a timeout when the process does not exit', async () => {
    const result = await runQalc(
      '1',
      limits,
      fakeSpawn(() => {}),
    );
    expect(result.status).toBe('timeout');
  });

  it('passes one expression after the option terminator and never writes stdin', async () => {
    const args: string[] = [];
    const result = await runQalc(
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

  it('reports a crashed worker', async () => {
    const result = await runQalc(
      '1',
      { ...limits, wallTimeMs: 100 },
      fakeSpawn((child) => {
        queueMicrotask(() => child.emit('close', 1, null));
      }),
    );
    expect(result.status).toBe('crashed_worker');
  });
});
