import { spawn } from 'node:child_process';
import type { ChildProcess } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseCalculatorOutput } from './protocol.js';
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
export type SpawnCalculator = typeof spawn;
interface ExitStatus {
  code: number | null;
  signal: NodeJS.Signals | null;
}

function appendBoundedOutput(
  current: Buffer,
  chunk: string | Buffer,
  maxBytes: number,
): { output: Buffer; tooLarge: boolean } {
  const output = Buffer.concat([current, Buffer.from(chunk)]);

  return {
    output: output.subarray(0, maxBytes + 1),
    tooLarge: output.byteLength > maxBytes,
  };
}

function killProcess(child: ChildProcess): void {
  child.kill('SIGKILL');
}

async function waitForExit(
  child: ChildProcess,
  signal: AbortSignal | undefined,
  wallTimeMs: number,
): Promise<{ exit: ExitStatus; timedOut: boolean }> {
  let timedOut = false;
  const exit = await new Promise<ExitStatus>((resolve, reject) => {
    let settled = false;
    const abort = (): void => {
      killProcess(child);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killProcess(child);
    }, wallTimeMs);
    const cleanup = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    };
    const finish = (value: ExitStatus): void => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      resolve(value);
    };

    signal?.addEventListener('abort', abort, { once: true });
    child.once('error', (error) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error);
    });
    child.once('close', (code, processSignal) => {
      finish({ code, signal: processSignal });
    });
  });

  return { exit, timedOut };
}

export async function runCalculator(
  expression: string,
  limits: Limits,
  spawnCalculator?: SpawnCalculator,
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
    // A fresh process and private HOME keep qalc stateless and isolate requests from one another.
    const spawnedChild = (spawnCalculator ?? spawn)('qalc', [...QALC_ARGS, '--', expression], {
      cwd: home,
      env: { PATH: process.env.PATH ?? '', HOME: home },
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    child = spawnedChild;
    let stdout: Buffer = Buffer.alloc(0);
    let outputTooLarge = false;
    spawnedChild.stdout?.setEncoding('utf8');
    spawnedChild.stdout?.on('data', (chunk: string) => {
      const appended = appendBoundedOutput(stdout, chunk, limits.maxOutputBytes);
      stdout = appended.output;
      outputTooLarge ||= appended.tooLarge;
      if (outputTooLarge) {
        killProcess(spawnedChild);
      }
    });
    const { exit, timedOut } = await waitForExit(spawnedChild, options.signal, limits.wallTimeMs);
    if (options.signal?.aborted) {
      return { status: 'upstream_failure', error: 'request cancelled' };
    }

    if (outputTooLarge) {
      return { status: 'malformed_output', error: 'output too large' };
    }

    if (timedOut) {
      return { status: 'timeout', error: 'qalc timed out' };
    }

    if (exit.signal !== null) {
      return {
        status: 'crashed_worker',
        error: 'qalc worker crashed',
      };
    }

    if (exit.code !== 0) {
      return {
        status: 'invalid_input',
        error: 'qalc could not evaluate the expression',
      };
    }

    return parseCalculatorOutput(stdout.toString('utf8'), limits.maxOutputBytes);
  } catch {
    return {
      status: 'upstream_failure',
      error: 'qalc unavailable',
    };
  } finally {
    if (child && !child.killed) {
      killProcess(child);
    }

    if (home) {
      await rm(home, { recursive: true, force: true }).catch(() => undefined);
    }
  }
}
