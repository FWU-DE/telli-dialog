import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({ env: { sandboxFusionUrl: 'https://sandbox.example' } }));

describe('execute code tool', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses the SandboxFusion run_code contract and normalized response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'success',
          message: 'ok',
          compile_result: {
            status: 'success',
            execution_time: 1,
            return_code: 0,
            stdout: '',
            stderr: '',
          },
          run_result: {
            status: 'success',
            execution_time: 2,
            return_code: 0,
            stdout: 'ok',
            stderr: '',
          },
        }),
      ),
    );
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const result = JSON.parse(
      (await buildExecuteCodeTool()?.handler({
        language: 'javascript',
        source: 'console.log(1)',
      })) ?? '',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sandbox.example/run_code',
      expect.objectContaining({
        body: JSON.stringify({
          language: 'nodejs',
          code: 'console.log(1)',
          stdin: '',
          compile_timeout: 5,
          run_timeout: 5,
          max_output_chars: 65536,
          memory_limit_MB: 128,
        }),
        signal: expect.any(AbortSignal),
      }),
    );
    expect(result).toEqual(expect.objectContaining({ status: 'success', message: 'ok' }));
    expect(result.run_result.stdout).toBe('ok');
  });

  it('bounds combined UTF-8 output and handles malformed JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'success',
          compile_result: null,
          run_result: {
            status: 'success',
            stdout: '😀'.repeat(20_000),
            stderr: 'stderr'.repeat(20_000),
          },
        }),
      ),
    );
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const result = JSON.parse(
      (await buildExecuteCodeTool()?.handler({ language: 'python', source: 'x' })) ?? '',
    );
    expect(
      new TextEncoder().encode(result.run_result.stdout + result.run_result.stderr).byteLength,
    ).toBeLessThanOrEqual(65536);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: 'success',
          compile_result: { status: 'success', stdout: 'c'.repeat(60_000), stderr: '' },
          run_result: { status: 'success', stdout: 'r'.repeat(60_000), stderr: '' },
        }),
      ),
    );
    const combined = JSON.parse(
      (await buildExecuteCodeTool()?.handler({ language: 'python', source: 'x' })) ?? '',
    );
    expect(
      new TextEncoder().encode(
        combined.compile_result.stdout +
          combined.compile_result.stderr +
          combined.run_result.stdout +
          combined.run_result.stderr,
      ).byteLength,
    ).toBeLessThanOrEqual(65536);
    expect(combined.compile_result.stdout.length).toBe(60_000);
    expect(combined.run_result.stdout.length).toBe(5_536);

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{malformed'));
    expect(
      JSON.parse(
        (await buildExecuteCodeTool()?.handler({ language: 'python', source: 'x' })) ?? '',
      ),
    ).toMatchObject({ status: 'invalid_response' });
  });

  it('returns distinct timeout and invalid request errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new DOMException('aborted', 'AbortError'));
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    expect(
      JSON.parse(
        (await buildExecuteCodeTool()?.handler({ language: 'python', source: 'x' })) ?? '',
      ),
    ).toMatchObject({ status: 'timeout' });
    expect(
      JSON.parse((await buildExecuteCodeTool()?.handler({ language: 'ruby', source: 'x' })) ?? ''),
    ).toMatchObject({ status: 'invalid_request' });
  });

  it('allows one call per registration and releases concurrency after completion', async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    vi.spyOn(globalThis, 'fetch').mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const firstTool = buildExecuteCodeTool();
    const first = firstTool?.handler({ language: 'python', source: 'x' });
    expect(await firstTool?.handler({ language: 'python', source: 'x' })).toMatch(/request_limit/);
    resolveFetch?.(new Response(JSON.stringify({ status: 'success' })));
    await first;
    expect(await firstTool?.handler({ language: 'python', source: 'x' })).toMatch(/request_limit/);
  });

  it('fails fast at the process concurrency limit and permits work after release', async () => {
    const resolvers: Array<(response: Response) => void> = [];
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise((resolve) => resolvers.push(resolve)),
    );
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    const tools = Array.from({ length: 5 }, () => buildExecuteCodeTool());
    const pending = tools
      .slice(0, 4)
      .map((tool) => tool?.handler({ language: 'python', source: 'x' }));
    await Promise.resolve();
    expect(await tools[4]?.handler({ language: 'python', source: 'x' })).toMatch(/busy/);
    resolvers
      .splice(0, 4)
      .forEach((resolve) => resolve(new Response(JSON.stringify({ status: 'success' }))));
    await Promise.all(pending);
    const replacement = buildExecuteCodeTool();
    const replacementResult = replacement?.handler({ language: 'python', source: 'x' });
    resolvers.shift()?.(new Response(JSON.stringify({ status: 'success' })));
    expect(await replacementResult).toMatch(/success/);
  });

  it('rejects malformed nested result fields and non-2xx responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('{}', { status: 500 }));
    const { buildExecuteCodeTool } = await import('./execute-code-tool');
    expect(await buildExecuteCodeTool()?.handler({ language: 'python', source: 'x' })).toMatch(
      /upstream_failure/,
    );
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'x', run_result: { status: 'x', bad: true } })),
    );
    expect(await buildExecuteCodeTool()?.handler({ language: 'python', source: 'x' })).toMatch(
      /invalid_response/,
    );
  });
});
