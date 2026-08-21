import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { buildCalculatorTool, resolveCalculatorChildPath } from './calculator-tool';
import { evaluateExpression } from './calculator-runtime.mjs';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { vi } from 'vitest';

const calculate = buildCalculatorTool().handler;
const result = async (expression: string) => JSON.parse(await calculate({ expression }));
const runtimeResult = (
  expression: string,
): { ok: boolean; error?: { code: string }; result?: string } => {
  try {
    return { ok: true, ...evaluateExpression(expression) };
  } catch (error) {
    return { ok: false, error: { code: (error as { code?: string }).code ?? 'ERROR' } };
  }
};

describe('calculator tool', () => {
  it('resolves the traced child from the app and standalone working directories', () => {
    expect(resolveCalculatorChildPath(process.cwd())).toMatch(
      /apps\/chat-bot\/src\/app\/api\/chat\/tools\/calculator-child\.mjs$/,
    );
    expect(resolveCalculatorChildPath(resolve(process.cwd(), '../..'))).toMatch(
      /apps\/chat-bot\/src\/app\/api\/chat\/tools\/calculator-child\.mjs$/,
    );
  });

  it('resolves the child lazily', async () => {
    const resolveChildPath = vi.fn(() => '/tmp/calculator-child.mjs');
    const child = childDouble();
    const tool = buildCalculatorTool({
      resolveChildPath,
      spawnProcess: vi.fn(() => child as never),
    });
    expect(resolveChildPath).not.toHaveBeenCalled();
    const pending = tool.handler({ expression: '1' });
    expect(resolveChildPath).toHaveBeenCalledOnce();
    child.stdout.end('{"ok":true,"result":"1"}');
    child.emit('close', 0);
    expect(JSON.parse(await pending).ok).toBe(true);
  });

  function childDouble() {
    const child = new EventEmitter() as EventEmitter & {
      stdin: PassThrough;
      stdout: PassThrough;
      kill: ReturnType<typeof vi.fn>;
    };
    child.stdin = new PassThrough();
    child.stdout = new PassThrough();
    child.kill = vi.fn();
    return child;
  }

  it('returns EXPRESSION_TIMEOUT, sends SIGKILL, and releases an active slot when child hangs', async () => {
    vi.useFakeTimers();
    try {
      const child = childDouble();
      const secondChild = childDouble();
      const spawnProcess = vi.fn().mockReturnValueOnce(child).mockReturnValueOnce(secondChild);
      const tool = buildCalculatorTool({
        spawnProcess,
        timeoutMs: 10,
        maxConcurrent: 1,
        maxQueue: 0,
      });
      const pending = tool.handler({ expression: '1' });
      await vi.advanceTimersByTimeAsync(10);
      expect(JSON.parse(await pending).error.code).toBe('EXPRESSION_TIMEOUT');
      expect(child.kill).toHaveBeenCalledWith('SIGKILL');
      const second = tool.handler({ expression: '2' });
      secondChild.stdout.end('{"ok":true,"result":"2"}');
      secondChild.emit('close', 0);
      expect(JSON.parse(await second).ok).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('drains queued calculation when active child closes', async () => {
    const firstChild = childDouble();
    const secondChild = childDouble();
    const children = [firstChild, secondChild];
    const tool = buildCalculatorTool({
      spawnProcess: vi.fn(() => children.shift() as never),
      maxConcurrent: 1,
      maxQueue: 1,
    });
    const first = tool.handler({ expression: '1' });
    const second = tool.handler({ expression: '2' });
    firstChild.stdout.end('{"ok":true,"result":"1"}');
    firstChild.emit('close', 0);
    expect(JSON.parse(await first).ok).toBe(true);
    secondChild.stdout.end('{"ok":true,"result":"2"}');
    secondChild.emit('close', 0);
    expect(JSON.parse(await second).ok).toBe(true);
  });

  it('returns CALCULATOR_BUSY when active and queued limits are saturated', async () => {
    const firstChild = childDouble();
    const queuedChild = childDouble();
    const tool = buildCalculatorTool({
      spawnProcess: vi.fn().mockReturnValueOnce(firstChild).mockReturnValueOnce(queuedChild),
      maxConcurrent: 1,
      maxQueue: 1,
    });
    const first = tool.handler({ expression: '1' });
    const queued = tool.handler({ expression: '2' });
    expect(JSON.parse(await tool.handler({ expression: '3' })).error.code).toBe('CALCULATOR_BUSY');
    firstChild.emit('close', 1);
    await first;
    queuedChild.emit('close', 1);
    await queued;
  });

  it('treats maxQueue zero as no queued work', async () => {
    const child = childDouble();
    const tool = buildCalculatorTool({
      spawnProcess: vi.fn(() => child as never),
      maxConcurrent: 1,
      maxQueue: 0,
    });
    const first = tool.handler({ expression: '1' });
    expect(JSON.parse(await tool.handler({ expression: '2' })).error.code).toBe('CALCULATOR_BUSY');
    child.emit('close', 1);
    await first;
  });

  it('kills child and returns PROTOCOL_ERROR on oversized stdout', async () => {
    const child = childDouble();
    const pending = buildCalculatorTool({ spawnProcess: vi.fn(() => child as never) }).handler({
      expression: '1',
    });
    child.stdout.write('x'.repeat(9000));
    expect(JSON.parse(await pending).error.code).toBe('PROTOCOL_ERROR');
    expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  });

  it('returns PROTOCOL_ERROR and releases slot on synchronous spawn throw', async () => {
    const child = childDouble();
    const spawnProcess = vi
      .fn()
      .mockImplementationOnce(() => {
        throw new Error('spawn');
      })
      .mockReturnValueOnce(child);
    const tool = buildCalculatorTool({ spawnProcess, maxConcurrent: 1, maxQueue: 1 });
    expect(JSON.parse(await tool.handler({ expression: '1' })).error.code).toBe('PROTOCOL_ERROR');
    const second = tool.handler({ expression: '1' });
    child.stdout.end('{"ok":true,"result":"1"}');
    child.emit('close', 0);
    expect(JSON.parse(await second).ok).toBe(true);
  });

  it('checks UTF-8 input boundaries and rejects empty input', async () => {
    expect(JSON.parse(await calculate({ expression: '' })).error.code).toBe('INVALID_INPUT');
    const child = childDouble();
    const boundaryTool = buildCalculatorTool({ spawnProcess: vi.fn(() => child as never) });
    const boundary = boundaryTool.handler({ expression: 'é'.repeat(500) });
    child.stdout.end('{"ok":true,"result":"boundary"}');
    child.emit('close', 0);
    expect(JSON.parse(await boundary).ok).toBe(true);
    expect(JSON.parse(await calculate({ expression: 'é'.repeat(501) })).error.code).toBe(
      'INVALID_INPUT',
    );
  });

  it('validates construction limits', () => {
    for (const option of ['timeoutMs', 'maxConcurrent'] as const) {
      for (const value of [0, -1, Number.NaN, Infinity, 1.5])
        expect(() => buildCalculatorTool({ [option]: value })).toThrow();
    }
    for (const value of [-1, Number.NaN, Infinity, 1.5])
      expect(() => buildCalculatorTool({ maxQueue: value })).toThrow();
    expect(() => buildCalculatorTool({ maxQueue: 0 })).not.toThrow();
  });

  it('handles asynchronous child errors', async () => {
    const child = childDouble();
    const pending = buildCalculatorTool({ spawnProcess: vi.fn(() => child as never) }).handler({
      expression: '1',
    });
    child.emit('error', new Error('child failed'));
    expect(JSON.parse(await pending).error.code).toBe('PROTOCOL_ERROR');
  });

  it('accepts output at the exact byte limit', async () => {
    const child = childDouble();
    const output = `{"ok":true,"result":"${'x'.repeat(8169)}"}`;
    expect(Buffer.byteLength(output)).toBe(8192);
    const pending = buildCalculatorTool({ spawnProcess: vi.fn(() => child as never) }).handler({
      expression: '1',
    });
    child.stdout.end(output);
    child.emit('close', 0);
    expect(await pending).toBe(output);
  });
  it.each([
    ['2 + 3 * 4', '14'],
    ['a+b (variables are rejected)', undefined],
    ['sqrt(16) + abs(-3) + sin(pi / 2)', '8'],
    ['2 cm + 3 cm', '5 cm'],
    ['1 / 3', '0.3333333333333333333333333333333333333333333333333333333333333333'],
  ])('evaluates %s', async (expression, expected) => {
    const response = await result(expression);
    if (expected === undefined) expect(response.ok).toBe(false);
    else expect(response.result).toBe(expected);
  });

  it.each([
    ['sqrt', 'sqrt(4)'],
    ['abs', 'abs(-4)'],
    ['sin', 'sin(0)'],
    ['cos', 'cos(0)'],
    ['tan', 'tan(0)'],
    ['asin', 'asin(0)'],
    ['acos', 'acos(1)'],
    ['atan', 'atan(0)'],
    ['log', 'log(1)'],
    ['log10', 'log10(1)'],
    ['exp', 'exp(0)'],
    ['round', 'round(1.2)'],
    ['floor', 'floor(1.2)'],
    ['ceil', 'ceil(1.2)'],
    ['min', 'min(1, 2)'],
    ['max', 'max(1, 2)'],
  ])('allows function %s', (_name, expression) => {
    expect(runtimeResult(expression).ok).toBe(true);
  });

  it.each(['pi', 'e', 'tau'])('allows constant %s', (constant) => {
    expect(runtimeResult(constant).ok).toBe(true);
  });

  it('rejects unavailable functions and excessive exponents deterministically', async () => {
    expect(runtimeResult('derivative(x^2, x)').error!.code).toBe('FUNCTION_NOT_ALLOWED');
    expect(() => evaluateExpression('2 ^ 1001')).toThrowError(
      expect.objectContaining({ code: 'EXPRESSION_TOO_COMPLEX' }),
    );
    expect(runtimeResult('2 ^ -1001').error!.code).toBe('EXPRESSION_TOO_COMPLEX');
    for (const expression of ['2^(1000+1)', '2^(10*10*10)', '2^pi', '2^sqrt(4)'])
      expect(runtimeResult(expression).error!.code).toBe('EXPONENT_NOT_ALLOWED');
  });

  it.each([
    ['1 < 2', 'OPERATOR_NOT_ALLOWED'],
    ['2!', 'OPERATOR_NOT_ALLOWED'],
    ['2 ^ pi', 'EXPONENT_NOT_ALLOWED'],
  ])('returns the stable operator error for %s', (expression, code) => {
    expect(runtimeResult(expression).error!.code).toBe(code);
  });

  it('returns stable errors for malformed, nonfinite, and invalid input', async () => {
    expect(runtimeResult('2 +').ok).toBe(false);
    expect(runtimeResult('1 / 0').error!.code).toBe('NONFINITE_RESULT');
    expect(JSON.parse(await calculate({ expression: 2 })).error.code).toBe('INVALID_INPUT');
    for (const expression of ['1 < 2', '2!', 'x = 2', '[1, 2]', 'x[0]', 'abc', 'fortnight']) {
      expect(runtimeResult(expression).ok).toBe(false);
    }
    expect(runtimeResult('1 m + 2 m').ok).toBe(true);
    expect(runtimeResult('Infinity m').error!.code).toBe('NONFINITE_RESULT');
    expect(runtimeResult('NaN m').error!.code).toBe('NONFINITE_RESULT');
    expect(runtimeResult('1 m to cm').result!).toBe('100 cm');
    expect(runtimeResult('20 degC to degF').result!).toBe('68 degF');
    expect(runtimeResult('1 m + 1 s').ok).toBe(false);
    for (const expression of [
      '[[1, 2]]',
      'simplify(2x)',
      'f(x)=x',
      '2.re',
      '2 + true',
      'null',
      '2 + 3i',
    ])
      expect(runtimeResult(expression).ok).toBe(false);
  }, 15000);

  it('rejects pure-runtime cost overflow independently of exponent limits', async () => {
    expect(() =>
      evaluateExpression(Array.from({ length: 101 }, () => 'sqrt(1)').join('+')),
    ).toThrowError(expect.objectContaining({ code: 'EXPRESSION_TOO_COMPLEX' }));
  });

  it('enforces structural node, depth, and literal limits', () => {
    expect(runtimeResult(Array.from({ length: 201 }, () => '1').join('+')).error!.code).toBe(
      'EXPRESSION_TOO_COMPLEX',
    );
    expect(runtimeResult(`${'('.repeat(33)}1${')'.repeat(33)}`).error!.code).toBe(
      'EXPRESSION_TOO_COMPLEX',
    );
    expect(runtimeResult(Array.from({ length: 101 }, () => '1').join('+')).error!.code).toBe(
      'EXPRESSION_TOO_COMPLEX',
    );
    expect(runtimeResult('1e10000').error!.code).toBe('EXPRESSION_TOO_COMPLEX');
  });

  it('normalizes malformed expressions', () => {
    expect(runtimeResult('2 +').error!.code).toBe('INVALID_EXPRESSION');
  });

  it('covers representative unit conversions', () => {
    expect(runtimeResult('1 kg to g').result).toBe('1000 g');
    expect(runtimeResult('1 h to s').result).toBe('3600 s');
    expect(runtimeResult('1 L to mL').result).toBe('1000 mL');
    expect(runtimeResult('180 deg to rad').result).toBe(
      '3.141592653589793238462643383279502884197169399375105820974944592 rad',
    );
    expect(runtimeResult('1 m + 1 s').error).toBeDefined();
    expect(runtimeResult('1 fortnight').error).toBeDefined();
  });

  it('resolves a runnable child entrypoint', async () => {
    expect((await result('2 + 2')).result).toBe('4');
  });
});
