import { z } from 'zod';
import { env } from '@/env';
import type { ToolDefinition, ToolRegistration } from './types';

const MAX_SOURCE_LENGTH = 32 * 1024;
const MAX_OUTPUT_BYTES = 64 * 1024;
const TIMEOUT_MS = 5_000;
const MAX_CONCURRENT_EXECUTIONS = 4;
let activeExecutions = 0;

const requestSchema = z
  .object({
    language: z.enum(['python', 'javascript', 'typescript']),
    source: z.string().min(1).max(MAX_SOURCE_LENGTH),
  })
  .strict();

const resultSchema = z
  .object({
    status: z.string(),
    execution_time: z.number().optional(),
    return_code: z.number().nullable().optional(),
    stdout: z.string().optional().default(''),
    stderr: z.string().optional().default(''),
  })
  .strict();
const responseSchema = z.object({
  status: z.string(),
  message: z.string().optional().default(''),
  compile_result: resultSchema.nullable().optional().default(null),
  run_result: resultSchema.nullable().optional().default(null),
});

const languageMap = { python: 'python', javascript: 'nodejs', typescript: 'typescript' } as const;

type NormalizedResult = z.infer<typeof resultSchema> | null;

function errorResult(status: string, message: string) {
  return JSON.stringify({ status, message, compile_result: null, run_result: null });
}

function truncateUtf8(value: string, maxBytes: number) {
  const bytes = new TextEncoder().encode(value);
  if (bytes.byteLength <= maxBytes) return value;
  const decoder = new TextDecoder('utf-8', { fatal: true });
  for (let end = maxBytes; end >= 0; end -= 1) {
    try {
      return decoder.decode(bytes.slice(0, end));
    } catch {
      // A cut may split a multi-byte code point; try the preceding byte.
    }
  }
  return '';
}

function normalizeResults(compileResult: NormalizedResult, runResult: NormalizedResult) {
  const results = [compileResult, runResult];
  let remaining = MAX_OUTPUT_BYTES;
  return results.map((result) => {
    if (!result) return null;
    const stdout = truncateUtf8(result.stdout, remaining);
    remaining -= new TextEncoder().encode(stdout).byteLength;
    const stderr = truncateUtf8(result.stderr, remaining);
    remaining -= new TextEncoder().encode(stderr).byteLength;
    return { ...result, stdout, stderr };
  });
}

export function buildExecuteCodeTool(): ToolRegistration | null {
  if (!env.sandboxFusionUrl) return null;
  let hasExecuted = false;

  const definition: ToolDefinition = {
    name: 'execute_code',
    description:
      'Execute a short Python, JavaScript, or TypeScript program. Standard library only; no stdin or files.',
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['python', 'javascript', 'typescript'] },
        source: { type: 'string', maxLength: MAX_SOURCE_LENGTH },
      },
      required: ['language', 'source'],
      additionalProperties: false,
    },
  };

  const handler = async (args: Record<string, unknown>) => {
    const parsed = requestSchema.safeParse(args);
    if (!parsed.success) return errorResult('invalid_request', 'Invalid code execution request.');
    if (hasExecuted)
      return errorResult('request_limit', 'Code execution is limited to one call per request.');
    hasExecuted = true;
    if (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
      return errorResult('busy', 'Code execution service is busy.');
    }
    activeExecutions += 1;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(`${env.sandboxFusionUrl}/run_code`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language: languageMap[parsed.data.language],
          code: parsed.data.source,
          stdin: '',
          compile_timeout: TIMEOUT_MS / 1000,
          run_timeout: TIMEOUT_MS / 1000,
          max_output_chars: MAX_OUTPUT_BYTES,
          memory_limit_MB: 128,
        }),
        signal: controller.signal,
      });
      if (!response.ok)
        return errorResult('upstream_failure', 'Code execution service unavailable.');

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return errorResult('invalid_response', 'Invalid code execution response.');
      }
      const result = responseSchema.safeParse(json);
      if (!result.success)
        return errorResult('invalid_response', 'Invalid code execution response.');
      const [compileResult, runResult] = normalizeResults(
        result.data.compile_result,
        result.data.run_result,
      );
      return JSON.stringify({
        status: result.data.status,
        message: result.data.message,
        compile_result: compileResult,
        run_result: runResult,
      });
    } catch (error) {
      return errorResult(
        error instanceof DOMException && error.name === 'AbortError'
          ? 'timeout'
          : 'upstream_failure',
        error instanceof DOMException && error.name === 'AbortError'
          ? 'Code execution timed out.'
          : 'Code execution failed.',
      );
    } finally {
      clearTimeout(timeout);
      activeExecutions -= 1;
    }
  };

  return { definition, handler };
}
