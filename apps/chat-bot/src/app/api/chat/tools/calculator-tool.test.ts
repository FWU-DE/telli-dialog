import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildCalculatorTool,
  resolveCalculatorWorkerPath,
  shutdownCalculatorPoolForTests,
  resetCalculatorPoolLifecycleForTests,
  terminateCalculatorPool,
} from './calculator-tool';
import { evaluateExpression } from './calculator-runtime.mjs';

const dto = (result = '1') => ({ ok: true as const, result, representation: 'scalar' as const });
const runtime = (expression: string) => {
  try {
    return { ok: true, ...evaluateExpression(expression) };
  } catch (error) {
    return { ok: false, code: (error as { code?: string }).code };
  }
};

describe('calculator tool', () => {
  afterEach(async () => {
    await terminateCalculatorPool();
    resetCalculatorPoolLifecycleForTests();
  });

  it('executes in a real workerpool process and recreates after termination', async () => {
    // Process workers include cold module startup in this task timeout. Keep this
    // lifecycle smoke test independent from production's latency budget.
    const tool = buildCalculatorTool({ timeoutMs: 10_000 });
    const first = JSON.parse(await tool.handler({ expression: '2 + 2' }));
    expect(first, `worker failed: ${JSON.stringify(first)}`).toMatchObject({
      ok: true,
      result: '4',
    });
    await terminateCalculatorPool();
    const recreated = JSON.parse(await tool.handler({ expression: '2 + 2' }));
    expect(recreated, `recreated worker failed: ${JSON.stringify(recreated)}`).toMatchObject({
      ok: true,
      result: '4',
    });
  });
  it('resolves the worker from app and repository roots', () => {
    expect(resolveCalculatorWorkerPath(process.cwd())).toMatch(/calculator-worker\.mjs$/);
    expect(resolveCalculatorWorkerPath(resolve(process.cwd(), '../..'))).toMatch(
      /calculator-worker\.mjs$/,
    );
  });

  it('maps injected executor success, timeout, busy, worker, and protocol failures', async () => {
    const executor = vi
      .fn()
      .mockResolvedValueOnce(dto('42'))
      .mockRejectedValueOnce(Object.assign(new Error('timed out'), { name: 'TimeoutError' }))
      .mockRejectedValueOnce(new Error('Max queue size of 16 reached'))
      .mockRejectedValueOnce(new Error('worker stopped'));
    const tool = buildCalculatorTool({ executor, timeoutMs: 25 });
    expect(JSON.parse(await tool.handler({ expression: '1' })).result).toBe('42');
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe(
      'EXPRESSION_TIMEOUT',
    );
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('CALCULATOR_BUSY');
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('PROTOCOL_ERROR');
    expect(executor).toHaveBeenCalledWith('1', 25);
  });

  it('rejects new default executions after graceful shutdown begins', async () => {
    await shutdownCalculatorPoolForTests();
    expect(JSON.parse(await buildCalculatorTool().handler({ expression: '2 + 2' }))).toMatchObject({
      ok: false,
      error: { code: 'CALCULATOR_SHUTTING_DOWN' },
    });
  });

  it('rejects malformed DTOs and enforces input/output byte caps', async () => {
    const executor = vi.fn().mockResolvedValue({ ok: true, result: 'x' });
    const tool = buildCalculatorTool({ executor });
    expect(JSON.parse(await tool.handler({ expression: '' })).error.code).toBe('INVALID_INPUT');
    expect(JSON.parse(await tool.handler({ expression: 'é'.repeat(501) })).error.code).toBe(
      'INVALID_INPUT',
    );
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('PROTOCOL_ERROR');
    executor.mockResolvedValue(dto('x'.repeat(8200)));
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('PROTOCOL_ERROR');
  });

  it.each([
    ['sqrt(16) + sin(pi / 2)', true],
    ['1 kg to g', true],
    ['expm1(1)', true],
    ['range(1, 3)', false],
    ['matrix([1, 2])', false],
    ['zeros(2)', false],
    ['map([1, 2], x)', false],
    ['random()', false],
    ['fortnight', false],
    ['unknown(1)', false],
    ['derivative(x^2, x)', false],
    ['1 < 2', false],
    ['x = 2', false],
    ['[1, 2]', false],
    ['x[0]', false],
    ['{a: 1}', false],
    ['1:3', false],
    ['1; 2', false],
    ['1 ? 2 : 3', false],
    ['"x"', false],
    ['2 + 3i', false],
    ['1 / 0', false],
  ])('evaluates %s according to policy', (expression, expected) => {
    expect(runtime(expression).ok).toBe(expected);
  });

  it('retains exponent, structural, literal, and cost limits', () => {
    expect(runtime('2 ^ 1001').code).toBe('EXPRESSION_TOO_COMPLEX');
    expect(runtime('2 ^ pi').code).toBe('EXPONENT_NOT_ALLOWED');
    expect(runtime(`${'('.repeat(33)}1${')'.repeat(33)}`).code).toBe('EXPRESSION_TOO_COMPLEX');
    expect(runtime(Array.from({ length: 101 }, () => '1').join('+')).code).toBe(
      'EXPRESSION_TOO_COMPLEX',
    );
    expect(runtime('1e10000').code).toBe('EXPRESSION_TOO_COMPLEX');
  });
});
