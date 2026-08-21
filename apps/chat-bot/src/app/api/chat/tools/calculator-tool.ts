import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ToolDefinition, ToolRegistration } from './types';

const TIMEOUT_MS = 3000;
const MAX_INPUT_BYTES = 1000;
const MAX_OUTPUT_BYTES = 8192;
const calculatorRelativePath = 'src/app/api/chat/tools/calculator-child.mjs';

/**
 * The standalone server runs from the repository root, while local Next.js
 * commands can run from the app directory (or the monorepo root). Resolve the
 * traced source file from either layout instead of using import.meta.url,
 * which Turbopack turns into a web asset URL.
 */
export const resolveCalculatorChildPath = (cwd = process.cwd()) => {
  const candidates = [
    resolve(cwd, calculatorRelativePath),
    resolve(cwd, 'apps/chat-bot', calculatorRelativePath),
  ];
  const childPath = candidates.find((candidate) => existsSync(candidate));
  if (!childPath) throw new Error(`Calculator child process not found in ${cwd}`);
  return childPath;
};

const childPath = resolveCalculatorChildPath();

const errorResponse = (code: string, message: string) =>
  JSON.stringify({ ok: false, error: { code, message } });

type CalculatorChild = Pick<ChildProcess, 'stdin' | 'stdout' | 'on' | 'kill'>;
type CalculatorOptions = {
  spawnProcess?: typeof spawn;
  timeoutMs?: number;
  maxConcurrent?: number;
  maxQueue?: number;
};

export function buildCalculatorTool(options: CalculatorOptions = {}): ToolRegistration {
  const spawnProcess = options.spawnProcess ?? spawn;
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const maxConcurrent = options.maxConcurrent ?? 4;
  const maxQueue = options.maxQueue ?? 16;
  let active = 0;
  const queue: Array<() => void> = [];
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
  const handler = async (args: Record<string, unknown>): Promise<string> => {
    if (typeof args.expression !== 'string' || args.expression.trim() === '')
      return errorResponse('INVALID_INPUT', 'expression must be a non-empty string');
    if (Buffer.byteLength(args.expression) > MAX_INPUT_BYTES)
      return errorResponse('INVALID_INPUT', 'expression is too long');
    if (active >= maxConcurrent && queue.length >= maxQueue)
      return errorResponse('CALCULATOR_BUSY', 'Calculator is busy');
    return new Promise((resolve) => {
      const start = () => {
        active++;
        let child: CalculatorChild;
        try {
          child = spawnProcess(process.execPath, [childPath], {
            stdio: ['pipe', 'pipe', 'ignore'],
            // eslint-disable-next-line turbo/no-undeclared-env-vars
            env: { PATH: process.env.PATH, NODE_ENV: 'production' },
          });
        } catch {
          active--;
          queue.shift()?.();
          resolve(errorResponse('PROTOCOL_ERROR', 'Calculator process failed'));
          return;
        }
        let output = '';
        let settled = false;
        let cleaned = false;
        const timerRef: { current?: ReturnType<typeof setTimeout> } = {};
        const cleanup = () => {
          if (cleaned) return;
          cleaned = true;
          if (timerRef.current) clearTimeout(timerRef.current);
          child.stdin?.destroy();
          active--;
          queue.shift()?.();
        };
        const settle = (value: string) => {
          if (settled) return;
          settled = true;
          resolve(value);
          cleanup();
        };
        timerRef.current = setTimeout(() => {
          child.kill('SIGKILL');
          settle(errorResponse('EXPRESSION_TIMEOUT', 'Calculation timed out'));
        }, timeoutMs);
        child.stdout?.on('data', (chunk: Buffer) => {
          output += chunk.toString();
          if (Buffer.byteLength(output) > MAX_OUTPUT_BYTES) {
            child.kill('SIGKILL');
            settle(errorResponse('PROTOCOL_ERROR', 'Calculator output exceeded limit'));
          }
        });
        child.on('error', () =>
          settle(errorResponse('PROTOCOL_ERROR', 'Calculator process failed')),
        );
        child.on('close', (code) => {
          if (!settled)
            settle(
              code === 0 && output.trim()
                ? output.trim()
                : errorResponse('PROTOCOL_ERROR', 'Calculator process failed'),
            );
        });
        child.stdin?.end(JSON.stringify({ expression: args.expression }));
      };
      if (active < maxConcurrent) start();
      else queue.push(start);
    });
  };
  return { definition, handler };
}
