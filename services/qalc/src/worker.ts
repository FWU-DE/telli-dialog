import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseQalcOutput } from './protocol.js';
import type { Limits, Result } from './types.js';

export const QALC_ARGS = [
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
] as const;
export type SpawnQalc = typeof spawn;

export async function runQalc(
  expression: string,
  limits: Limits,
  spawnQalc?: SpawnQalc,
  options: { signal?: AbortSignal } = {},
): Promise<Result> {
  if (options.signal?.aborted) {
    return { status: 'upstream_failure', error: 'request cancelled' };
  }

  let home: string | undefined;
  let child: ReturnType<typeof spawn> | undefined;
  try {
    home = await mkdtemp(join(tmpdir(), 'qalc-'));
    if (options.signal?.aborted) {
      return { status: 'upstream_failure', error: 'request cancelled' };
    }
    child = (spawnQalc ?? spawn)('qalc', [...QALC_ARGS, '--', expression], {
      cwd: home,
      env: { PATH: process.env.PATH ?? '', HOME: home },
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    let stdout: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let outputTooLarge = false;
    const append = (current: Buffer, chunk: string | Buffer): Buffer => {
      const next = Buffer.concat([current, Buffer.from(chunk)]);
      if (next.byteLength > limits.maxOutputBytes) outputTooLarge = true;
      return next.subarray(0, limits.maxOutputBytes + 1);
    };
    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk: string) => {
      stdout = append(stdout, chunk);
      if (outputTooLarge) child?.kill('SIGKILL');
    });
    let timedOut = false;
    const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(
      (resolve, reject) => {
        let settled = false;
        const finish = (value: { code: number | null; signal: NodeJS.Signals | null }) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', abort);
            resolve(value);
          }
        };
        const abort = () => child?.kill('SIGKILL');
        const timer = setTimeout(() => {
          timedOut = true;
          child?.kill('SIGKILL');
        }, limits.wallTimeMs);
        options.signal?.addEventListener('abort', abort, { once: true });
        child?.once('error', (error) => {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', abort);
            reject(error);
          }
        });
        child?.once('close', (code, signal) => {
          finish({ code, signal });
        });
      },
    );
    if (options.signal?.aborted) return { status: 'upstream_failure', error: 'request cancelled' };
    if (outputTooLarge) return { status: 'malformed_output', error: 'output too large' };
    if (timedOut) return { status: 'timeout', error: 'qalc timed out' };
    if (exit.signal !== null)
      return {
        status: 'crashed_worker',
        error: 'qalc worker crashed',
      };
    if (exit.code !== 0)
      return {
        status: 'invalid_input',
        error: 'qalc could not evaluate the expression',
      };
    return parseQalcOutput(stdout.toString('utf8'), limits.maxOutputBytes);
  } catch {
    return {
      status: 'upstream_failure',
      error: 'qalc unavailable',
    };
  } finally {
    if (child && !child.killed) child.kill('SIGKILL');
    if (home) await rm(home, { recursive: true, force: true }).catch(() => undefined);
  }
}
