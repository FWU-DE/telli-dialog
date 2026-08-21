import workerpool from 'workerpool';
import { evaluateExpression, LIMITS } from './calculator-runtime.mjs';

const errorDto = (code, message) => ({ ok: false, error: { code, message } });

function calculate(expression) {
  try {
    if (
      typeof expression !== 'string' ||
      expression.trim() === '' ||
      Buffer.byteLength(expression) > 1000
    )
      return errorDto('INVALID_INPUT', 'expression must be a string of at most 1000 bytes');
    const evaluated = evaluateExpression(expression);
    const response = { ok: true, ...evaluated };
    if (
      response.ok !== true ||
      typeof response.result !== 'string' ||
      !['scalar', 'unit'].includes(response.representation)
    )
      return errorDto('PROTOCOL_ERROR', 'Invalid calculator result');
    if (Buffer.byteLength(JSON.stringify(response)) > LIMITS.output)
      return errorDto('PROTOCOL_ERROR', 'Result exceeds output limit');
    return response;
  } catch (error) {
    return errorDto(error?.code ?? 'INVALID_EXPRESSION', error?.message ?? 'Invalid expression');
  }
}

workerpool.worker({ calculate });
