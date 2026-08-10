import { beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

describe('Piston execute client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PISTON_URL = 'http://piston.internal';
  });

  it.each([
    ['python', 'main.py'],
    ['javascript', 'main.js'],
    ['typescript', 'main.ts'],
  ] as const)('maps %s requests to a fixed runtime and filename', async (language, filename) => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          language,
          version: 'fixed',
          run: { stdout: 'ok', stderr: '', code: 0, signal: null },
        }),
        { status: 200 },
      ),
    );
    const { executeCode } = await import('./execute-code-client');
    await executeCode({ language, code: 'print(1)', stdin: 'input' });
    const request = fetchMock.mock.calls[0]?.[1];
    const body = JSON.parse(request.body);
    expect(body.language).toBe(language);
    expect(body.files).toEqual([{ name: filename, content: 'print(1)' }]);
    expect(body.stdin).toBe('input');
    expect(body.run_timeout).toBe(5_000);
    expect(body.run_memory_limit).toBe(128 * 1024 * 1024);
  });

  it('handles timeout, network failure, malformed responses, and truncation', async () => {
    const { executeCode } = await import('./execute-code-client');
    fetchMock.mockRejectedValueOnce(new DOMException('timeout', 'AbortError'));
    await expect(executeCode({ language: 'python', code: 'x', stdin: '' })).resolves.toEqual(
      expect.objectContaining({ error: expect.stringContaining('Zeitlimit') }),
    );
    fetchMock.mockRejectedValueOnce(new Error('network'));
    await expect(executeCode({ language: 'python', code: 'x', stdin: '' })).resolves.toEqual(
      expect.objectContaining({ error: expect.stringContaining('nicht erreichbar') }),
    );
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 200 }));
    await expect(executeCode({ language: 'python', code: 'x', stdin: '' })).resolves.toEqual(
      expect.objectContaining({ error: expect.stringContaining('Ungültige Antwort') }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          language: 'python',
          version: 'fixed',
          run: { stdout: 'x'.repeat(6_001), stderr: 'err', code: 0, signal: null },
        }),
        { status: 200 },
      ),
    );
    await expect(executeCode({ language: 'python', code: 'x', stdin: '' })).resolves.toEqual(
      expect.objectContaining({ truncated: true, stdout: 'x'.repeat(6_000) }),
    );
  });

  it('normalizes compilation and runtime errors', async () => {
    const { executeCode } = await import('./execute-code-client');
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          language: 'python',
          version: 'fixed',
          compile: { stdout: '', stderr: 'syntax', code: 1, signal: null },
          run: { stdout: '', stderr: '', code: null, signal: null },
        }),
        { status: 200 },
      ),
    );
    await expect(executeCode({ language: 'python', code: 'x', stdin: '' })).resolves.toEqual(
      expect.objectContaining({ status: 'compilation_error', stderr: 'syntax' }),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          language: 'python',
          version: 'fixed',
          run: { stdout: '', stderr: 'failed', code: 1, signal: null },
        }),
        { status: 200 },
      ),
    );
    await expect(executeCode({ language: 'python', code: 'x', stdin: '' })).resolves.toEqual(
      expect.objectContaining({ status: 'runtime_error', stderr: 'failed' }),
    );
  });
});
