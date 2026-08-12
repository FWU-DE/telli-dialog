import { env } from '@/env';
import { z } from 'zod';

export const codeExecutionRequestSchema = z
  .object({
    language: z.enum(['python', 'javascript', 'typescript']),
    sourceCode: z.string().min(1).max(256_000),
  })
  .strict();

export type CodeExecutionRequest = z.infer<typeof codeExecutionRequestSchema>;

const LANGUAGE_IDS: Record<CodeExecutionRequest['language'], number> = {
  python: 71,
  javascript: 63,
  typescript: 74,
};

const MAX_OUTPUT = 64_000;
const MAX_CONCURRENT_EXECUTIONS = 4;
let activeExecutions = 0;
const LIMITS = {
  cpu_time_limit: 2,
  wall_time_limit: 5,
  memory_limit: 128_000,
  max_processes_and_or_threads: 32,
  max_file_size: 1_024,
} as const;

type Judge0Submission = {
  token?: string;
  status?: { id?: number; description?: string } | string;
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  exit_code?: number | null;
  time?: string | null;
  memory?: number | null;
};

export type CodeExecutionResult = {
  status: string;
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  exitCode: number | null;
  time: string | null;
  memory: number | null;
};

const bounded = (value: string | null | undefined, max = MAX_OUTPUT) => (value ?? '').slice(0, max);

async function judge0Request(url: string, init: RequestInit): Promise<Judge0Submission> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'X-Auth-Token': env.judge0Token,
      'X-Auth-User': env.judge0Token,
      ...init.headers,
    },
    signal: AbortSignal.timeout(env.judge0TimeoutMs),
  });
  if (!response.ok) throw new Error('Judge0 request failed');
  return (await response.json()) as Judge0Submission;
}

async function deleteSubmission(baseUrl: string, token: string): Promise<void> {
  const response = await fetch(`${baseUrl}/submissions/${encodeURIComponent(token)}`, {
    method: 'DELETE',
    headers: {
      'X-Auth-Token': env.judge0Token,
      'X-Auth-User': env.judge0Token,
    },
    signal: AbortSignal.timeout(env.judge0TimeoutMs),
  });
  if (!response.ok) throw new Error('Judge0 submission cleanup failed');
}

export class CodeExecutionCapacityError extends Error {}

export async function executeCode(input: CodeExecutionRequest): Promise<CodeExecutionResult> {
  if (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
    throw new CodeExecutionCapacityError('Code execution capacity reached');
  }
  activeExecutions += 1;

  const baseUrl = env.judge0Url.replace(/\/$/, '');
  let token: string | undefined;
  try {
    const submitted = await judge0Request(
      `${baseUrl}/submissions?base64_encoded=false&wait=false`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          language_id: LANGUAGE_IDS[input.language],
          source_code: input.sourceCode,
          enable_network: false,
          ...LIMITS,
        }),
      },
    );
    if (!submitted.token) throw new Error('Judge0 did not return a submission token');
    token = submitted.token;

    const deadline = Date.now() + env.judge0TimeoutMs;
    let result = submitted;
    let completed = false;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, env.judge0PollIntervalMs));
      result = await judge0Request(
        `${baseUrl}/submissions/${encodeURIComponent(submitted.token)}?base64_encoded=false`,
        { method: 'GET' },
      );
      const statusId = typeof result.status === 'object' ? result.status.id : undefined;
      if (statusId !== undefined && statusId > 2) {
        completed = true;
        break;
      }
    }

    if (!completed) throw new Error('Judge0 execution timed out');

    const status = typeof result.status === 'string' ? result.status : result.status?.description;
    return {
      status: bounded(status, 100),
      stdout: bounded(result.stdout),
      stderr: bounded(result.stderr),
      compileOutput: bounded(result.compile_output),
      message: bounded(result.message),
      exitCode: result.exit_code ?? null,
      time: result.time ?? null,
      memory: result.memory ?? null,
    };
  } finally {
    try {
      if (token) await deleteSubmission(baseUrl, token);
    } finally {
      activeExecutions -= 1;
    }
  }
}
