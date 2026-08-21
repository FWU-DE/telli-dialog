import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ToolDefinition, ToolRegistration } from './types';

const TIMEOUT_MS = 3000;
const MAX_INPUT_BYTES = 1000;
const MAX_OUTPUT_BYTES = 8192;
const DEFAULT_MAX_CONCURRENT = 4;
const DEFAULT_MAX_QUEUE = 16;
const calculatorRelativePath = 'src/app/api/chat/tools/calculator-child.mjs';

export const resolveCalculatorChildPath = (cwd = process.cwd()) => {
  const candidates = [
    resolve(cwd, calculatorRelativePath),
    resolve(cwd, 'apps/chat-bot', calculatorRelativePath),
  ];
  const childPath = candidates.find((candidate) => existsSync(candidate));
  if (!childPath) throw new Error(`Calculator child process not found in ${cwd}`);
  return childPath;
};

const errorResponse = (code: string, message: string) =>
  JSON.stringify({ ok: false, error: { code, message } });

const INVALID_INPUT_RESPONSE = (message: string) => errorResponse('INVALID_INPUT', message);
const PROCESS_ERROR_RESPONSE = () => errorResponse('PROTOCOL_ERROR', 'Calculator process failed');
const busyResponse = () => errorResponse('CALCULATOR_BUSY', 'Calculator is busy');

type CalculatorChild = Pick<ChildProcess, 'stdin' | 'stdout' | 'on' | 'kill'>;
type SpawnProcess = typeof spawn;

export type CalculatorOptions = {
  spawnProcess?: SpawnProcess;
  resolveChildPath?: () => string;
  timeoutMs?: number;
  maxConcurrent?: number;
  maxQueue?: number;
};

const validatePositiveInteger = (name: string, value: number | undefined, fallback: number) => {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || !Number.isFinite(resolved) || resolved <= 0)
    throw new Error(`${name} must be a positive finite integer`);
  return resolved;
};

const validateNonNegativeInteger = (name: string, value: number | undefined, fallback: number) => {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || !Number.isFinite(resolved) || resolved < 0)
    throw new Error(`${name} must be a non-negative finite integer`);
  return resolved;
};

class ConcurrencyScheduler {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueue: number,
  ) {}

  run<T>(task: () => Promise<T>, busyValue: T): Promise<T> {
    if (this.active >= this.maxConcurrent && this.queue.length >= this.maxQueue)
      return Promise.resolve(busyValue);

    return new Promise((resolveTask, rejectTask) => {
      const start = () => {
        this.active++;
        task().then(
          (value) => {
            this.active--;
            this.queue.shift()?.();
            resolveTask(value);
          },
          (error: unknown) => {
            this.active--;
            this.queue.shift()?.();
            rejectTask(error);
          },
        );
      };
      if (this.active < this.maxConcurrent) start();
      else this.queue.push(start);
    });
  }
}

const definition: ToolDefinition = {
  name: 'calculate',
  description:
    'Calculate high-precision scientific arithmetic and unit conversions. Use for arithmetic, scientific functions, and units; relay returned error messages clearly.',
  parameters: {
    type: 'object',
    properties: { expression: { type: 'string', description: 'A mathematical expression.' } },
    required: ['expression'],
    additionalProperties: false,
  },
};

const runCalculatorProcess = async ({
  expression,
  spawnProcess,
  resolveChildPath,
  timeoutMs,
}: {
  expression: string;
  spawnProcess: SpawnProcess;
  resolveChildPath: () => string;
  timeoutMs: number;
}) =>
  new Promise<string>((resolveResult) => {
    let child: CalculatorChild;
    try {
      child = spawnProcess(process.execPath, [resolveChildPath()], {
        stdio: ['pipe', 'pipe', 'ignore'],
        // eslint-disable-next-line turbo/no-undeclared-env-vars
        env: { PATH: process.env.PATH, NODE_ENV: 'production' },
      });
    } catch {
      resolveResult(PROCESS_ERROR_RESPONSE());
      return;
    }

    let output = '';
    let settled = false;
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      settle(errorResponse('EXPRESSION_TIMEOUT', 'Calculation timed out'));
    }, timeoutMs);

    const settle = (response: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.stdin?.destroy();
      resolveResult(response);
    };

    child.stdout?.on('data', (chunk: Buffer | string) => {
      output += chunk.toString();
      if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) {
        child.kill('SIGKILL');
        settle(errorResponse('PROTOCOL_ERROR', 'Calculator output exceeded limit'));
      }
    });
    child.on('error', () => settle(PROCESS_ERROR_RESPONSE()));
    child.on('close', (code) => {
      if (settled) return;
      settle(code === 0 && output.trim() ? output.trim() : PROCESS_ERROR_RESPONSE());
    });
    child.stdin?.end(JSON.stringify({ expression }));
  });

export function buildCalculatorTool(options: CalculatorOptions = {}): ToolRegistration {
  const timeoutMs = validatePositiveInteger('timeoutMs', options.timeoutMs, TIMEOUT_MS);
  const maxConcurrent = validatePositiveInteger(
    'maxConcurrent',
    options.maxConcurrent,
    DEFAULT_MAX_CONCURRENT,
  );
  const maxQueue = validateNonNegativeInteger('maxQueue', options.maxQueue, DEFAULT_MAX_QUEUE);
  const scheduler = new ConcurrencyScheduler(maxConcurrent, maxQueue);
  const spawnProcess = options.spawnProcess ?? spawn;
  const resolveChildPath = options.resolveChildPath ?? resolveCalculatorChildPath;

  const handler = async (args: Record<string, unknown>): Promise<string> => {
    if (typeof args.expression !== 'string' || args.expression.trim() === '')
      return INVALID_INPUT_RESPONSE('expression must be a non-empty string');
    if (Buffer.byteLength(args.expression) > MAX_INPUT_BYTES)
      return INVALID_INPUT_RESPONSE('expression is too long');
    return scheduler.run(
      () =>
        runCalculatorProcess({
          expression: args.expression as string,
          spawnProcess,
          resolveChildPath,
          timeoutMs,
        }),
      busyResponse(),
    );
  };

  return { definition, handler };
}
