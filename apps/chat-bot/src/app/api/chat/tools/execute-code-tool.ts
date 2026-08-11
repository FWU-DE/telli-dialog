import { z } from 'zod';
import { env } from '@/env';
import type { ToolDefinition, ToolRegistration } from './types';

const MAX_BYTES = 64 * 1024;
const MAX_OUTPUT_FIELD_BYTES = MAX_BYTES / 2;
const REQUEST_TIMEOUT_MS = 30_000;
const languages = ['python', 'javascript', 'typescript'] as const;
const argsSchema = z
  .object({
    language: z.enum(languages),
    source: z
      .string()
      .min(1)
      .refine((value) => Buffer.byteLength(value, 'utf8') <= MAX_BYTES),
  })
  .strict();
const responseSchema = z
  .object({
    exitCode: z.number().int(),
    stdout: z.string(),
    stderr: z.string(),
    timedOut: z.boolean(),
  })
  .strict();

function redact(value: string) {
  return value
    .replace(/(bearer\s+)[^\s]+/gi, '$1[redacted]')
    .replace(/((?:api[_-]?key|token|secret|password)\s*[:=]\s*)[^\s,;]+/gi, '$1[redacted]')
    .slice(0, MAX_OUTPUT_FIELD_BYTES);
}

export function buildExecuteCodeTool({
  gatewayUrl = env.llmSandboxUrl,
  gatewayToken = env.llmSandboxApiToken,
}: { gatewayUrl?: string; gatewayToken?: string } = {}): ToolRegistration | null {
  if (!gatewayUrl || !gatewayToken) return null;
  const definition: ToolDefinition = {
    name: 'execute_code',
    description:
      'Execute Python, JavaScript, or TypeScript in an isolated sandbox without libraries or network access.',
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: [...languages] },
        source: { type: 'string', description: 'Program source, maximum 64 KiB.' },
      },
      required: ['language', 'source'],
      additionalProperties: false,
    },
  };
  const handler = async (args: Record<string, unknown>) => {
    const parsed = argsSchema.safeParse(args);
    if (!parsed.success) return JSON.stringify({ error: 'Invalid code execution arguments.' });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(new URL('/v1/execute', gatewayUrl), {
        method: 'POST',
        headers: { Authorization: `Bearer ${gatewayToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
        signal: controller.signal,
      });
      if (!response.ok) return JSON.stringify({ error: 'Code execution service unavailable.' });
      const result = responseSchema.safeParse(await response.json());
      if (!result.success) return JSON.stringify({ error: 'Invalid execution response.' });
      if (
        Buffer.byteLength(result.data.stdout, 'utf8') +
          Buffer.byteLength(result.data.stderr, 'utf8') >
        MAX_BYTES
      ) {
        return JSON.stringify({ error: 'Invalid execution response.' });
      }
      return JSON.stringify({
        ...result.data,
        stdout: redact(result.data.stdout),
        stderr: redact(result.data.stderr),
      });
    } catch (error) {
      return JSON.stringify({
        error:
          error instanceof DOMException && error.name === 'AbortError'
            ? 'Code execution timed out.'
            : 'Code execution failed.',
      });
    } finally {
      clearTimeout(timeout);
    }
  };
  return { definition, handler };
}
