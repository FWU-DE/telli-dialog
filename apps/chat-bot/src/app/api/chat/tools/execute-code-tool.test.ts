import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildExecuteCodeTool } from './execute-code-tool';

afterEach(() => vi.restoreAllMocks());
beforeEach(() => vi.useRealTimers());

describe('buildExecuteCodeTool', () => {
  it('is unavailable without complete gateway configuration', () => {
    expect(buildExecuteCodeTool({ gatewayUrl: 'https://sandbox.test' })).toBeNull();
    expect(buildExecuteCodeTool({ gatewayToken: 'token' })).toBeNull();
  });

  it.each(['python', 'javascript', 'typescript'] as const)('accepts %s', async (language) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ exitCode: 0, stdout: 'ok', stderr: '', timedOut: false })),
    );
    const tool = buildExecuteCodeTool({
      gatewayUrl: 'https://sandbox.test',
      gatewayToken: 'secret',
    });
    expect(tool?.definition.name).toBe('execute_code');
    await tool?.handler({ language, source: '1 + 1' });
    const [url, request] = vi.mocked(globalThis.fetch).mock.calls[0] ?? [];
    expect(String(url)).toBe('https://sandbox.test/v1/execute');
    expect(request?.method).toBe('POST');
    expect(request?.body).toBe(JSON.stringify({ language, source: '1 + 1' }));
    expect(new Headers(request?.headers).get('authorization')).toBe('Bearer secret');
    expect(new Headers(request?.headers).get('content-type')).toBe('application/json');
  });

  it('rejects empty, extra, unsupported, and oversized UTF-8 arguments', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const tool = buildExecuteCodeTool({
      gatewayUrl: 'https://sandbox.test',
      gatewayToken: 'secret',
    });
    expect(await tool!.handler({})).toContain('Invalid');
    expect(await tool!.handler({ language: 'python', source: '' })).toContain('Invalid');
    expect(await tool!.handler({ language: 'ruby', source: 'x' })).toContain('Invalid');
    expect(await tool!.handler({ language: 'python', source: 'x', extra: true })).toContain(
      'Invalid',
    );
    expect(
      await tool!.handler({ language: 'python', source: '😀'.repeat(16 * 1024 + 1) }),
    ).toContain('Invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns safe errors for malformed, oversized, and non-2xx responses', async () => {
    const tool = buildExecuteCodeTool({
      gatewayUrl: 'https://sandbox.test',
      gatewayToken: 'secret',
    });
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('{bad'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            exitCode: 0,
            stdout: '😀'.repeat(16 * 1024),
            stderr: 'x',
            timedOut: false,
          }),
        ),
      )
      .mockResolvedValueOnce(new Response('nope', { status: 503 }));
    expect(await tool!.handler({ language: 'python', source: 'x' })).toMatch(/error/);
    expect(await tool!.handler({ language: 'python', source: 'x' })).toMatch(/error/);
    expect(await tool!.handler({ language: 'python', source: 'x' })).toContain(
      'service unavailable',
    );
  });

  it('redacts secrets and aborts after timeout without waiting ten seconds', async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        ),
    );
    const tool = buildExecuteCodeTool({
      gatewayUrl: 'https://sandbox.test',
      gatewayToken: 'secret',
    });
    const resultPromise = tool!.handler({ language: 'python', source: 'sleep()' });
    await vi.advanceTimersByTimeAsync(30_000);
    const result = await resultPromise;
    expect(result).toContain('timed out');
  });

  it('redacts bearer and named secrets in output', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          exitCode: 0,
          stdout: 'Bearer top-secret api_key=abc123 password: hunter2',
          stderr: '',
          timedOut: false,
        }),
      ),
    );
    const tool = buildExecuteCodeTool({
      gatewayUrl: 'https://sandbox.test',
      gatewayToken: 'secret',
    });
    const result = await tool!.handler({ language: 'python', source: 'x' });
    expect(result).not.toContain('top-secret');
    expect(result).not.toContain('abc123');
    expect(result).not.toContain('hunter2');
  });
});
