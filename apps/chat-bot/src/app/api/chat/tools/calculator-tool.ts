import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import workerpool, { type Pool } from 'workerpool';
import type { ToolDefinition, ToolRegistration } from './types';

const TIMEOUT_MS = 3000;
const MAX_INPUT_BYTES = 1000;
const MAX_OUTPUT_BYTES = 8192;
const calculatorRelativePath = 'src/app/api/chat/tools/calculator-worker.mjs';

export const resolveCalculatorWorkerPath = (cwd = process.cwd()) => {
  const candidates = [
    resolve(cwd, calculatorRelativePath),
    resolve(cwd, 'apps/chat-bot', calculatorRelativePath),
  ];
  const childPath = candidates.find((candidate) => existsSync(candidate));
  if (!childPath) throw new Error(`Calculator worker not found in ${cwd}`);
  return childPath;
};

const errorResponse = (code: string, message: string) =>
  JSON.stringify({ ok: false, error: { code, message } });

const INVALID_INPUT_RESPONSE = (message: string) => errorResponse('INVALID_INPUT', message);
const PROCESS_ERROR_RESPONSE = () => errorResponse('PROTOCOL_ERROR', 'Calculator worker failed');
const busyResponse = () => errorResponse('CALCULATOR_BUSY', 'Calculator is busy');
const SHUTTING_DOWN_RESPONSE = () =>
  errorResponse('CALCULATOR_SHUTTING_DOWN', 'Calculator is shutting down');

export type CalculatorOptions = {
  executor?: (expression: string, timeoutMs: number) => Promise<CalculatorResult>;
  timeoutMs?: number;
};
type CalculatorResult = {
  ok: boolean;
  result?: string;
  representation?: string;
  error?: { code: string; message: string };
};

const isCalculatorResult = (value: unknown): value is CalculatorResult => {
  if (!value || typeof value !== 'object' || typeof (value as CalculatorResult).ok !== 'boolean')
    return false;
  const result = value as CalculatorResult;
  return result.ok
    ? typeof result.result === 'string' &&
        (result.representation === 'scalar' || result.representation === 'unit')
    : Boolean(
        result.error &&
        typeof result.error.code === 'string' &&
        typeof result.error.message === 'string',
      );
};

let pool: Pool | undefined;
let shuttingDown = false;
const getCalculatorPool = () => {
  if (!pool) {
    pool = workerpool.pool(resolveCalculatorWorkerPath(), {
      workerType: 'process',
      minWorkers: 1,
      maxWorkers: 4,
      maxQueueSize: 16,
      workerTerminateTimeout: 1000,
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      forkOpts: { env: { NODE_ENV: 'production', PATH: process.env.PATH ?? '' } },
    });
  }
  return pool;
};

export async function terminateCalculatorPool(): Promise<void> {
  if (shuttingDown) return;
  const currentPool = pool;
  pool = undefined;
  if (currentPool) await currentPool.terminate(false, 1000);
}

async function shutdownCalculatorPool(): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  const currentPool = pool;
  pool = undefined;
  if (!currentPool) return;
  try {
    await currentPool.terminate(false, 1000);
  } catch {
    // Best effort only: never leave an unhandled rejection during signal handling.
  }
}

export const shutdownCalculatorPoolForTests = shutdownCalculatorPool;
export const resetCalculatorPoolLifecycleForTests = () => {
  shuttingDown = false;
};

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void shutdownCalculatorPool().finally(() => process.exit(0));
  });
}

const execute = async (expression: string, timeoutMs: number) => {
  if (shuttingDown) throw new Error('Calculator pool is shutting down');
  return (
    getCalculatorPool().exec('calculate', [expression]) as Promise<CalculatorResult> & {
      timeout: (ms: number) => Promise<CalculatorResult>;
    }
  ).timeout(timeoutMs);
};

const mapWorkerError = (error: unknown) => {
  const name = error instanceof Error ? error.name : '';
  if (name === 'TimeoutError' || name === 'WrappedTimeoutError')
    return errorResponse('EXPRESSION_TIMEOUT', 'Calculation timed out');
  if (error instanceof Error && error.message.startsWith('Max queue size of'))
    return busyResponse();
  return PROCESS_ERROR_RESPONSE();
};

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

export function buildCalculatorTool(options: CalculatorOptions = {}): ToolRegistration {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) throw new Error('timeoutMs must be positive');
  const executor = options.executor ?? execute;

  const handler = async (args: Record<string, unknown>): Promise<string> => {
    if (typeof args.expression !== 'string' || args.expression.trim() === '')
      return INVALID_INPUT_RESPONSE('expression must be a non-empty string');
    if (Buffer.byteLength(args.expression) > MAX_INPUT_BYTES)
      return INVALID_INPUT_RESPONSE('expression is too long');
    if (shuttingDown) return SHUTTING_DOWN_RESPONSE();
    try {
      const value = await executor(args.expression as string, timeoutMs);
      if (!isCalculatorResult(value)) return PROCESS_ERROR_RESPONSE();
      const serialized = JSON.stringify(value);
      return Buffer.byteLength(serialized) <= MAX_OUTPUT_BYTES
        ? serialized
        : errorResponse('PROTOCOL_ERROR', 'Calculator output exceeded limit');
    } catch (error) {
      return mapWorkerError(error);
    }
  };

  return { definition, handler };
}
