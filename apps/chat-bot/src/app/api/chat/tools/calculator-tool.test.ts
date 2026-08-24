import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'workerpool';
import {
  buildCalculatorTool,
  resetCalculatorPoolFactoryForTests,
  resolveCalculatorWorkerPath,
  setCalculatorPoolFactoryForTests,
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
    resetCalculatorPoolFactoryForTests();
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

  it('waits for an in-flight termination before creating the next pool', async () => {
    let releaseTermination!: () => void;
    const terminationFinished = new Promise<void>((resolve) => {
      releaseTermination = resolve;
    });
    const execution = (result: ReturnType<typeof dto>) =>
      Object.assign(Promise.resolve(result), { timeout: () => Promise.resolve(result) });
    const firstPool = {
      exec: vi.fn().mockReturnValue(execution(dto('first'))),
      terminate: vi.fn(() => terminationFinished),
    } as unknown as Pool;
    const secondPool = {
      exec: vi.fn().mockReturnValue(execution(dto('second'))),
      terminate: vi.fn().mockResolvedValue(undefined),
    } as unknown as Pool;
    const factory = vi.fn().mockReturnValueOnce(firstPool).mockReturnValueOnce(secondPool);
    setCalculatorPoolFactoryForTests(factory);
    const tool = buildCalculatorTool();

    await tool.handler({ expression: '1' });
    const terminating = terminateCalculatorPool();
    const nextExecution = tool.handler({ expression: '2' });
    await Promise.resolve();
    expect(factory).toHaveBeenCalledTimes(1);

    releaseTermination();
    await terminating;
    expect(await nextExecution).toContain('second');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('maps injected executor success, timeout, busy, worker, and protocol failures', async () => {
    const executor = vi
      .fn()
      .mockResolvedValueOnce(dto('42'))
      .mockRejectedValueOnce(Object.assign(new Error('timed out'), { name: 'TimeoutError' }))
      .mockRejectedValueOnce({ error: { name: 'TimeoutError' } })
      .mockRejectedValueOnce(new Error('Max queue size of 16 reached'))
      .mockRejectedValueOnce(new Error('worker stopped'));
    const tool = buildCalculatorTool({ executor, timeoutMs: 25 });
    expect(JSON.parse(await tool.handler({ expression: '1' })).result).toBe('42');
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe(
      'EXPRESSION_TIMEOUT',
    );
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe(
      'EXPRESSION_TIMEOUT',
    );
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('CALCULATOR_BUSY');
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('PROTOCOL_ERROR');
    expect(executor).toHaveBeenCalledWith('1', 25);
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

  it.each(['1e999 kg', '-(1e999)', 'abs(1e999)'])(
    'rejects out-of-range numeric magnitude in %s before evaluation',
    (expression) => {
      expect(runtime(expression)).toMatchObject({ ok: false, code: 'EXPRESSION_TOO_COMPLEX' });
    },
  );

  it.each(['10^101', '10^100 * 10^100', '(10+0)^100'])(
    'rejects oversized derived magnitude in %s before evaluation',
    (expression) => {
      expect(runtime(expression)).toMatchObject({ ok: false, code: 'EXPRESSION_TOO_COMPLEX' });
    },
  );

  it.each(['pow(10, 1001)', 'nthRoot(10, 0.0001)'])(
    'blocks removed growth bypass %s without evaluating it',
    (expression) => {
      expect(runtime(expression)).toMatchObject({ ok: false, code: 'FUNCTION_NOT_ALLOWED' });
    },
  );

  it.each(['exp(1e6)', 'exp(1000 + 0)', 'sinh(1e6)'])(
    'rejects oversized growth input %s before evaluation',
    (expression) => {
      expect(runtime(expression)).toMatchObject({ ok: false, code: 'EXPRESSION_TOO_COMPLEX' });
    },
  );

  it.each(['exp(1)', 'expm1(1)', 'sinh(1)', 'cosh(1)', 'tanh(1)', 'exp(230)'])(
    'allows in-policy growth expression %s',
    (expression) => {
      expect(runtime(expression).ok).toBe(true);
    },
  );

  it.each(['exp(230) * exp(230)', 'exp(230)^2', 'exp(230) * exp(230) * exp(1)'])(
    'rejects composed growth magnitude in %s before evaluation',
    (expression) => {
      expect(runtime(expression)).toMatchObject({ ok: false, code: 'EXPRESSION_TOO_COMPLEX' });
    },
  );

  it.each(['1e100 + 0', '1e100 + 1e100', '1e100 - 1e100'])(
    'allows safe exact arithmetic %s',
    (expression) => {
      expect(runtime(expression).ok).toBe(true);
    },
  );

  it.each(['1e100', '1e-100', '1.2e10', '1 kg to g', 'sqrt(16)'])(
    'continues to evaluate legitimate numeric expression %s',
    (expression) => {
      expect(runtime(expression).ok).toBe(true);
    },
  );

  it.each([
    ['gamma', 'gamma(5)', 'gamma((10)^100)', 'gamma((10+0)^100)', 'gamma(1e999)'],
    [
      'factorial',
      'factorial(5)',
      'factorial((10)^10)',
      'factorial((10+0)^100)',
      'factorial(1e999)',
    ],
    [
      'combinations',
      'combinations(10, 2)',
      'combinations(10^100, 2)',
      'combinations((10+0)^100, 2)',
      'combinations(1e999, 2)',
    ],
    ['combinationsWithRep', 'combinationsWithRep(10, 2)', 'combinationsWithRep(10^100, 2)'],
    ['isPrime', 'isPrime(1e100)', 'isPrime(17)'],
    [
      'permutations',
      'permutations(10, 2)',
      'permutations(10^100, 2)',
      'permutations((10+0)^100, 2)',
      'permutations(1e999, 2)',
    ],
  ])('blocks %s before evaluating normal and pathological arguments', (_name, ...expressions) => {
    expressions.forEach((expression) => {
      expect(runtime(expression)).toMatchObject({ ok: false, code: 'FUNCTION_NOT_ALLOWED' });
    });
  });
});
