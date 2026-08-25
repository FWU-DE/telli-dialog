import { z } from 'zod';
import { qalc, QALC_MAX_EXPRESSION_LENGTH, type QalcResponse } from '../qalc';
import type { ToolDefinition, ToolRegistration } from './types';

const expressionSchema = z.string().trim().min(1).max(QALC_MAX_EXPRESSION_LENGTH);

export function buildQalcTool(): ToolRegistration {
  const definition: ToolDefinition = {
    name: 'math_calculate',
    description:
      'Calculate exactly one mathematical expression. The expression must use qalc syntax. Translate the user request into qalc syntax before calling this tool. Return only the expression, never a question or explanation. Use semicolons for function arguments. Examples: "2 + 2"; "1/3 to fraction"; "25% * 200"; "factor(x^2 - 4)"; "solve(2x^2 + 3x - 5 = 0; x)"; "diff(x^4; x; 2)"; "integrate(2x)" (indefinite); "integrate(x^2; 0; 1)" (definite); "limit(1/x; infinity)"; "varp([1 2 3])" or "var([1 2 3])"; "binomial(5; 2)"; "[1 2; 3 4]"; "pi * 5^2" (circle area); "1/2 * 3 * 4" (triangle area); "sqrt(3^2 + 4^2)" (right-triangle side); "sqrt(16)"; "12 km / 3 h". Do not invent results: use only the returned result. If qalc returns an error, report it briefly and ask the user to rephrase or provide missing values; do not explain qalc internals or syntax and do not provide a result.',
    parameters: {
      type: 'object',
      properties: {
        expression: {
          type: 'string',
          description: 'A single qalc expression (not a question or explanation).',
          minLength: 1,
          maxLength: QALC_MAX_EXPRESSION_LENGTH,
        },
      },
      required: ['expression'],
      additionalProperties: false,
    },
  };

  const handler = async (args: Record<string, unknown>): Promise<string> => {
    const parsed = expressionSchema.safeParse(args.expression);
    if (!parsed.success) {
      const response: QalcResponse = {
        status: 'invalid_input',
        result: null,
        error: 'Invalid expression.',
      };
      return JSON.stringify(response);
    }
    return JSON.stringify(await qalc(parsed.data));
  };

  return { definition, handler };
}
