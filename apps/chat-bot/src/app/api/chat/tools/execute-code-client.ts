import { z } from 'zod';
import { env } from '@/env';

export const MAX_CODE_LENGTH = 20_000;
export const MAX_STDIN_LENGTH = 10_000;
export const EXECUTION_TIMEOUT_MS = 5_000;
export const MAX_OUTPUT_LENGTH = 6_000;

const pistonResponseSchema = z.object({
  language: z.string(),
  version: z.string(),
  run: z.object({
    stdout: z.string(),
    stderr: z.string(),
    code: z.number().int().nullable(),
    signal: z.string().nullable(),
    output: z.string().optional(),
  }),
  compile: z
    .object({
      stdout: z.string(),
      stderr: z.string(),
      code: z.number().int().nullable(),
      signal: z.string().nullable(),
      output: z.string().optional(),
    })
    .optional(),
});

const runtimes = {
  python: { language: 'python', version: '3.12.0' },
  javascript: { language: 'javascript', version: '20.11.1' },
  typescript: { language: 'typescript', version: '5.0.3' },
} as const;

type CodeLanguage = keyof typeof runtimes;

export type ExecuteCodeResult = {
  language: CodeLanguage;
  status: 'success' | 'compilation_error' | 'runtime_error';
  exitCode: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
};

export function isPistonConfigured() {
  return Boolean(env.pistonUrl);
}

function truncate(value: string) {
  return value.length > MAX_OUTPUT_LENGTH
    ? { value: value.slice(0, MAX_OUTPUT_LENGTH), truncated: true }
    : { value, truncated: false };
}

export async function executeCode({
  language,
  code,
  stdin,
}: {
  language: CodeLanguage;
  code: string;
  stdin: string;
}): Promise<ExecuteCodeResult | { error: string }> {
  if (!env.pistonUrl) return { error: 'Error: Code-Ausführung ist nicht verfügbar.' };

  const runtime = runtimes[language];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXECUTION_TIMEOUT_MS + 500);

  try {
    const response = await fetch(new URL('/api/v2/execute', env.pistonUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [
          {
            name:
              language === 'python' ? 'main.py' : language === 'typescript' ? 'main.ts' : 'main.js',
            content: code,
          },
        ],
        stdin,
        compile_timeout: EXECUTION_TIMEOUT_MS,
        run_timeout: EXECUTION_TIMEOUT_MS,
        compile_memory_limit: 128 * 1024 * 1024,
        run_memory_limit: 128 * 1024 * 1024,
      }),
      signal: controller.signal,
    });

    if (response.status === 429)
      return { error: 'Error: Der Code-Ausführungsdienst ist ausgelastet.' };
    if (response.status === 408)
      return { error: 'Error: Die Code-Ausführung hat das Zeitlimit überschritten.' };
    if (response.status === 413)
      return { error: 'Error: Die Ausgabe der Code-Ausführung war zu groß.' };
    if (!response.ok) return { error: 'Error: Der Code-Ausführungsdienst ist nicht verfügbar.' };

    const parsed = pistonResponseSchema.safeParse(await response.json());
    if (!parsed.success) return { error: 'Error: Ungültige Antwort des Code-Ausführungsdienstes.' };

    const compile = parsed.data.compile;
    const output =
      compile?.code !== 0 && compile
        ? { ...compile, status: 'compilation_error' as const }
        : parsed.data.run.code !== 0 || parsed.data.run.signal
          ? { ...parsed.data.run, status: 'runtime_error' as const }
          : { ...parsed.data.run, status: 'success' as const };
    const stdout = truncate(output.stdout);
    const stderr = truncate(output.stderr);

    return {
      language,
      status: output.status,
      exitCode: output.code,
      signal: output.signal,
      stdout: stdout.value,
      stderr: stderr.value,
      truncated: stdout.truncated || stderr.truncated,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error && error.name === 'AbortError'
          ? 'Error: Die Code-Ausführung hat das Zeitlimit überschritten.'
          : 'Error: Der Code-Ausführungsdienst ist nicht erreichbar.',
    };
  } finally {
    clearTimeout(timeout);
  }
}
