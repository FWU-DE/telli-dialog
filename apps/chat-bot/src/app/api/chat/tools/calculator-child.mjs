import { evaluateExpression, LIMITS } from './calculator-runtime.mjs';

const fail = (code, message) => JSON.stringify({ ok: false, error: { code, message } });
let input = '';
process.stdin.on('data', (chunk) => {
  input += chunk;
  if (Buffer.byteLength(input) > 1000) process.stdin.destroy();
});
process.stdin.on('error', () => process.exit(1));
process.stdin.on('end', () => {
  try {
    const request = JSON.parse(input);
    if (typeof request.expression !== 'string' || request.expression.length > 1000)
      throw Object.assign(new Error('expression must be a string of at most 1000 characters'), {
        code: 'INVALID_INPUT',
      });
    const evaluated = evaluateExpression(request.expression);
    const response = JSON.stringify({ ok: true, ...evaluated });
    if (Buffer.byteLength(response) > LIMITS.output)
      throw Object.assign(new Error('Result exceeds output limit'), { code: 'PROTOCOL_ERROR' });
    process.stdout.write(response);
  } catch (error) {
    process.stdout.write(
      fail(error.code ?? 'INVALID_EXPRESSION', error.message ?? 'Invalid expression'),
    );
  }
});
