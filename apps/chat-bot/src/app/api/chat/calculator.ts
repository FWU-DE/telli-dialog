import { z } from 'zod';
import { env } from '@/env';

export const CALCULATOR_MAX_EXPRESSION_LENGTH = 4_096;
export const CALCULATOR_MAX_OUTPUT_LENGTH = 16_000;
export const CALCULATOR_TIMEOUT_MS = 5_000;

const CALCULATOR_STATUSES = [
  'success',
  'invalid_input',
  'overload',
  'timeout',
  'crashed_worker',
  'malformed_output',
  'upstream_failure',
  'internal_failure',
] as const;

const calculatorResponseSchema = z
  .object({
    status: z.enum(CALCULATOR_STATUSES),
    result: z.string().optional(),
    error: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.status === 'success' && (!value.result || value.error !== undefined)) {
      context.addIssue({ code: 'custom', message: 'success response must contain only a result' });
    }
    if (value.status !== 'success' && (value.result !== undefined || !value.error)) {
      context.addIssue({ code: 'custom', message: 'failure response must contain only an error' });
    }
  });

export type CalculatorResponse = {
  status: string;
  result: string | null;
  error: string | null;
};

function stableResponse(input: z.infer<typeof calculatorResponseSchema>): CalculatorResponse {
  return {
    status: input.status,
    result: input.result ?? null,
    error: input.error ?? null,
  };
}

async function readBoundedBody(response: Response): Promise<string> {
  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text) > CALCULATOR_MAX_OUTPUT_LENGTH)
      throw new Error('response body too large');
    return text;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > CALCULATOR_MAX_OUTPUT_LENGTH) throw new Error('response body too large');
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

export async function calculate(expression: string): Promise<CalculatorResponse> {
  const parsedExpression = z
    .string()
    .trim()
    .min(1)
    .max(CALCULATOR_MAX_EXPRESSION_LENGTH)
    .safeParse(expression);
  if (!parsedExpression.success) {
    return { status: 'invalid_input', result: null, error: 'Invalid expression.' };
  }

  try {
    const response = await fetch(`${env.calculatorUrl}/v1/calculate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ expression: parsedExpression.data }),
      signal: AbortSignal.timeout(CALCULATOR_TIMEOUT_MS),
    });
    const body = await readBoundedBody(response);
    let rawBody: unknown;
    try {
      rawBody = JSON.parse(body);
    } catch {
      return { status: 'malformed_output', result: null, error: 'Malformed calculator response.' };
    }
    const parsed = calculatorResponseSchema.safeParse(rawBody);
    if (!parsed.success) {
      return response.ok
        ? { status: 'malformed_output', result: null, error: 'Malformed calculator response.' }
        : { status: 'upstream_failure', result: null, error: 'Calculator request failed.' };
    }
    const result = stableResponse(parsed.data);
    if (
      result.result !== null &&
      Buffer.byteLength(result.result, 'utf-8') > CALCULATOR_MAX_OUTPUT_LENGTH
    ) {
      return { status: 'malformed_output', result: null, error: 'Calculator output too large.' };
    }
    if (!response.ok) {
      if (result.status !== 'success') return result;
      return {
        status: 'upstream_failure',
        result: null,
        error: result.error ?? `Calculator request failed (${response.status}).`,
      };
    }
    return result;
  } catch (error) {
    const outputTooLarge =
      error instanceof Error && error.message.includes('response body too large');
    return {
      status: outputTooLarge
        ? 'malformed_output'
        : error instanceof DOMException &&
            (error.name === 'TimeoutError' || error.name === 'AbortError')
          ? 'timeout'
          : 'upstream_failure',
      result: null,
      error: outputTooLarge ? 'Calculator response too large.' : 'Calculator unavailable.',
    };
  }
}
