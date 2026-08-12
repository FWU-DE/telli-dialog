import { beforeEach, describe, expect, it, vi } from 'vitest';
import { codeExecutionRequestSchema } from './code-execution';

vi.mock('@/env', () => ({
  env: {
    judge0Url: 'https://judge0.example.test/',
    judge0Token: 'judge0-test-token-that-is-long-enough',
    judge0TimeoutMs: 100,
    judge0PollIntervalMs: 1,
  },
}));

describe('code execution request', () => {
  it('accepts only the supported language and source', () => {
    expect(
      codeExecutionRequestSchema.safeParse({ language: 'python', sourceCode: 'print(1)' }).success,
    ).toBe(true);
  });

  it('rejects options and unknown languages', () => {
    expect(
      codeExecutionRequestSchema.safeParse({ language: 'ruby', sourceCode: 'puts 1' }).success,
    ).toBe(false);
    expect(
      codeExecutionRequestSchema.safeParse({ language: 'python', sourceCode: 'x', stdin: 'bad' })
        .success,
    ).toBe(false);
  });

  it('bounds source size', () => {
    expect(
      codeExecutionRequestSchema.safeParse({ language: 'python', sourceCode: 'x'.repeat(256_001) })
        .success,
    ).toBe(false);
  });
});

describe('executeCode', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('submits with fixed safe limits, disabled network, mapped language, polls, and bounds results', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ token: 'token/1' }), { status: 201 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: { id: 2, description: 'Processing' } })),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: { id: 3, description: 'Accepted' },
            stdout: 'o'.repeat(65_000),
            stderr: null,
            compile_output: 'compile',
            message: null,
            exit_code: 0,
            time: null,
            memory: null,
          }),
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { executeCode } = await import('./code-execution');
    const result = await executeCode({ language: 'typescript', sourceCode: 'console.log(1)' });

    expect(result.stdout).toHaveLength(64_000);
    expect(result).toMatchObject({
      status: 'Accepted',
      stderr: '',
      compileOutput: 'compile',
      message: '',
      exitCode: 0,
    });
    expect(fetchMock.mock.calls[0]).toEqual([
      'https://judge0.example.test/submissions?base64_encoded=false&wait=false',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
        body: JSON.stringify({
          language_id: 74,
          source_code: 'console.log(1)',
          enable_network: false,
          cpu_time_limit: 2,
          wall_time_limit: 5,
          memory_limit: 128_000,
          max_processes_and_or_threads: 32,
          max_file_size: 1_024,
        }),
      }),
    ]);
    expect(fetchMock.mock.calls[1]![0]).toBe(
      'https://judge0.example.test/submissions/token%2F1?base64_encoded=false',
    );
    expect(fetchMock.mock.calls[3]).toEqual([
      'https://judge0.example.test/submissions/token%2F1',
      expect.objectContaining({ method: 'DELETE' }),
    ]);
  });

  it('fails on malformed submission responses and Judge0 errors', async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 201 }));
    const { executeCode } = await import('./code-execution');
    await expect(executeCode({ language: 'python', sourceCode: 'print(1)' })).rejects.toThrow(
      'submission token',
    );

    fetchMock.mockReset();
    fetchMock.mockResolvedValueOnce(new Response('bad', { status: 503 }));
    await expect(executeCode({ language: 'python', sourceCode: 'print(1)' })).rejects.toThrow(
      'Judge0 request failed',
    );
  });

  it('times out when Judge0 never reaches a terminal status', async () => {
    fetchMock
      .mockImplementationOnce(() =>
        Promise.resolve(new Response(JSON.stringify({ token: 'never', status: { id: 2 } }))),
      )
      .mockImplementation(() =>
        Promise.resolve(new Response(JSON.stringify({ status: { id: 2 } }))),
      );
    const { executeCode } = await import('./code-execution');
    await expect(executeCode({ language: 'javascript', sourceCode: '1' })).rejects.toThrow(
      'timed out',
    );
    expect(fetchMock.mock.calls.at(-1)).toEqual([
      'https://judge0.example.test/submissions/never',
      expect.objectContaining({ method: 'DELETE' }),
    ]);
  });
});
