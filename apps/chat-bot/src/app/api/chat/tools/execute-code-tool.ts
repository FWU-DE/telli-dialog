import { z } from 'zod';
import { env } from '@/env';
import type { ToolDefinition, ToolRegistration } from './types';

export const MAX_SOURCE_CODE_LENGTH = 256_000;
const requestSchema = z
  .object({
    language: z.enum(['python', 'javascript', 'typescript']),
    sourceCode: z.string().min(1).max(MAX_SOURCE_CODE_LENGTH),
  })
  .strict();
const resultSchema = z.object({
  status: z.string(),
  stdout: z.string(),
  stderr: z.string(),
  compileOutput: z.string(),
  message: z.string(),
  exitCode: z.number().nullable(),
  time: z.string().nullable(),
  memory: z.number().nullable(),
});

export function buildExecuteCodeTool(): ToolRegistration | null {
  const definition: ToolDefinition = {
    name: 'execute_code',
    description: `Execute sandboxed Python, JavaScript, or TypeScript source code (maximum ${MAX_SOURCE_CODE_LENGTH} characters). Network access is disabled.`,
    parameters: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: ['python', 'javascript', 'typescript'] },
        sourceCode: { type: 'string', maxLength: MAX_SOURCE_CODE_LENGTH },
      },
      required: ['language', 'sourceCode'],
      additionalProperties: false,
    },
  };
  const handler = async (args: Record<string, unknown>): Promise<string> => {
    const parsed = requestSchema.safeParse(args);
    if (!parsed.success) return JSON.stringify({ error: 'Invalid execute_code arguments.' });
    try {
      const response = await fetch(`${env.apiUrl.replace(/\/$/, '')}/v1/code/execute`, {
        method: 'POST',
        headers: { authorization: `Bearer ${env.apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify(parsed.data),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return JSON.stringify({ error: 'Code execution failed.' });
      const result = resultSchema.safeParse(await response.json());
      return result.success
        ? JSON.stringify(result.data)
        : JSON.stringify({ error: 'Invalid execution result.' });
    } catch {
      return JSON.stringify({ error: 'Code execution unavailable.' });
    }
  };
  return { definition, handler };
}
