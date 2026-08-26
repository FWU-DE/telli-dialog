import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/env', () => ({ env: { calculatorUrl: 'http://localhost:8081' } }));

afterEach(() => vi.restoreAllMocks());

describe('calculator', () => {
  it('returns a stable successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'success', result: '4' }))),
    );
    const { calculate } = await import('./calculator');
    await expect(calculate('2 + 2')).resolves.toEqual({
      status: 'success',
      result: '4',
      error: null,
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:8081/v1/calculate',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('rejects malformed service responses and non-2xx responses without throwing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('not json', { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status: 'invalid_input', error: 'bad' }), { status: 400 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { calculate } = await import('./calculator');
    await expect(calculate('x')).resolves.toMatchObject({
      status: 'malformed_output',
      result: null,
    });
    await expect(calculate('x')).resolves.toEqual({
      status: 'invalid_input',
      result: null,
      error: 'bad',
    });
  });

  it('rejects statuses unknown to the standalone service', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ status: 'unexpected', result: '4' }))),
    );
    const { calculate } = await import('./calculator');
    await expect(calculate('2 + 2')).resolves.toMatchObject({ status: 'malformed_output' });
  });

  it('maps contradictory and unknown non-2xx responses to stable upstream failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status: 'success', result: '4', error: 'bad' }), {
            status: 200,
          }),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ status: 'unexpected', result: '4' }), { status: 502 }),
        ),
    );
    const { calculate } = await import('./calculator');
    await expect(calculate('x')).resolves.toMatchObject({ status: 'malformed_output' });
    await expect(calculate('x')).resolves.toEqual({
      status: 'upstream_failure',
      result: null,
      error: 'Calculator request failed.',
    });
  });

  it('handles timeout and oversized expression/output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')),
    );
    const { calculate, CALCULATOR_MAX_EXPRESSION_LENGTH } = await import('./calculator');
    await expect(
      calculate('x'.repeat(CALCULATOR_MAX_EXPRESSION_LENGTH + 1)),
    ).resolves.toMatchObject({
      status: 'invalid_input',
    });
    await expect(calculate('x')).resolves.toMatchObject({ status: 'timeout' });
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ status: 'success', result: 'y'.repeat(16_001) })),
        ),
    );
    await expect(calculate('x')).resolves.toMatchObject({ status: 'malformed_output' });
  });
});
