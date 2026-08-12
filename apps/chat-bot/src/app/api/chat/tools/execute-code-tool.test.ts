import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

vi.mock('@/env', () => ({
  env: { apiUrl: 'https://api.example.test/', apiKey: 'tool-secret' },
}));

describe('buildExecuteCodeTool', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('rejects unsupported, empty, oversized, and extra arguments without a request', async () => {
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const tool = buildExecuteCodeTool()!;

    for (const args of [
      { language: 'ruby', sourceCode: 'puts 1' },
      { language: 'python', sourceCode: '' },
      { language: 'python', sourceCode: 'x'.repeat(256_001) },
      { language: 'python', sourceCode: 'print(1)', stdin: 'secret' },
    ]) {
      expect(JSON.parse(await tool.handler(args))).toEqual({
        error: 'Invalid execute_code arguments.',
      });
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends language/source with the API bearer header and returns a valid result', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'Accepted',
          stdout: '1',
          stderr: '',
          compileOutput: '',
          message: '',
          exitCode: 0,
          time: '0.1',
          memory: 100,
        }),
        { status: 200 },
      ),
    );
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const result = JSON.parse(
      await buildExecuteCodeTool()!.handler({
        language: 'typescript',
        sourceCode: 'console.log(1)',
      }),
    );

    expect(result).toMatchObject({ status: 'Accepted', stdout: '1', exitCode: 0 });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/v1/code/execute',
      expect.objectContaining({
        method: 'POST',
        headers: { authorization: 'Bearer tool-secret', 'content-type': 'application/json' },
        body: JSON.stringify({ language: 'typescript', sourceCode: 'console.log(1)' }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it.each([
    [
      'HTTP failure',
      Promise.resolve(new Response('nope', { status: 502 })),
      'Code execution failed.',
    ],
    [
      'malformed result',
      Promise.resolve(new Response('{}', { status: 200 })),
      'Invalid execution result.',
    ],
    ['network failure', () => Promise.reject(new Error('offline')), 'Code execution unavailable.'],
  ])('returns a safe error for %s', async (_name, response, error) => {
    fetchMock.mockImplementation(() => (typeof response === 'function' ? response() : response));
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    expect(
      JSON.parse(await buildExecuteCodeTool()!.handler({ language: 'python', sourceCode: '1' })),
    ).toEqual({ error });
  });
});
