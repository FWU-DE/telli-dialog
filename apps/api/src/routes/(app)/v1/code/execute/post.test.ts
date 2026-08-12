import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  validateApiKey: vi.fn(),
  executeCode: vi.fn(),
}));

vi.mock('@/routes/utils', () => ({ validateApiKey: mocks.validateApiKey }));
vi.mock('@/code-execution', () => ({
  CodeExecutionCapacityError: class CodeExecutionCapacityError extends Error {},
  executeCode: mocks.executeCode,
  codeExecutionRequestSchema: {
    safeParse: (body: unknown) => {
      if (!body || typeof body !== 'object' || !('language' in body) || !('sourceCode' in body))
        return { success: false, error: { message: 'invalid' } };
      return { success: true, data: body };
    },
  },
}));

const reply = () => {
  const state = { statusCode: 200, body: undefined as unknown };
  return {
    state,
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    send(body: unknown) {
      state.body = body;
      return this;
    },
  };
};

describe('POST /v1/code/execute handler', () => {
  it('stops unauthenticated requests before validation or execution', async () => {
    mocks.validateApiKey.mockResolvedValueOnce(undefined);
    const { handler } = await import('./post');
    const response = reply();
    await handler({ body: {} } as never, response as never);
    expect(response.state.statusCode).toBe(200);
    expect(mocks.executeCode).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid input', async () => {
    mocks.validateApiKey.mockResolvedValueOnce({ id: 'key-1' });
    const { handler } = await import('./post');
    const response = reply();
    await handler({ body: { language: 'ruby' } } as never, response as never);
    expect(response.state).toMatchObject({ statusCode: 400, body: { error: 'Bad request' } });
  });

  it('maps execution failures to 502', async () => {
    mocks.validateApiKey.mockResolvedValueOnce({ id: 'key-1' });
    mocks.executeCode.mockRejectedValueOnce(new Error('Judge0 down'));
    const { handler } = await import('./post');
    const response = reply();
    await handler(
      { body: { language: 'python', sourceCode: 'print(1)' } } as never,
      response as never,
    );
    expect(response.state).toEqual({
      statusCode: 502,
      body: { error: 'Code execution service unavailable' },
    });
  });
});
