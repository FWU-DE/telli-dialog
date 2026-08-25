import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ qalcMock: vi.fn() }));
vi.mock('../qalc', async (importOriginal) => ({
  ...(await importOriginal()),
  qalc: mocks.qalcMock,
}));

beforeEach(() => mocks.qalcMock.mockReset());

describe('buildQalcTool', () => {
  it('defines qalc examples and serializes valid handler results', async () => {
    mocks.qalcMock.mockResolvedValue({ status: 'success', result: '4', error: null });
    const { buildQalcTool } = await import('./qalc-tool');
    const tool = buildQalcTool();
    if (!tool) throw new Error('expected enabled qalc tool');
    expect(tool.definition.name).toBe('math_calculate');
    expect(tool.definition.parameters).toMatchObject({
      properties: { expression: { minLength: 1 } },
    });
    expect(JSON.parse(await tool.handler({ expression: ' 2 + 2 ' }))).toEqual({
      status: 'success',
      result: '4',
      error: null,
    });
    expect(mocks.qalcMock).toHaveBeenCalledWith('2 + 2');
  });

  it('serializes calculator errors without changing them', async () => {
    mocks.qalcMock.mockResolvedValue({
      status: 'invalid_input',
      result: null,
      error: 'Calculator could not parse the expression.',
    });
    const { buildQalcTool } = await import('./qalc-tool');
    const tool = buildQalcTool();
    if (!tool) throw new Error('expected enabled qalc tool');

    expect(JSON.parse(await tool.handler({ expression: 'not valid' }))).toEqual({
      status: 'invalid_input',
      result: null,
      error: 'Calculator could not parse the expression.',
    });
  });

  it('returns JSON for invalid expressions without calling the client', async () => {
    const { buildQalcTool } = await import('./qalc-tool');
    const tool = buildQalcTool();
    if (!tool) throw new Error('expected enabled qalc tool');
    const raw = await tool.handler({ expression: '' });
    expect(JSON.parse(raw)).toMatchObject({ status: 'invalid_input' });
    expect(mocks.qalcMock).not.toHaveBeenCalled();
  });
});
