import fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { DEFAULT_LIMITS, validateRequest } from './validation.js';
import { WorkerPool } from './pool.js';
import type { Limits, Result } from './types.js';

const statusCodes: Record<Result['status'], number> = {
  success: 200,
  invalid_input: 400,
  overload: 429,
  timeout: 504,
  crashed_worker: 502,
  malformed_output: 502,
  upstream_failure: 503,
  internal_failure: 500,
};

export type CalculatorServer = FastifyInstance;

export function createCalculatorServer(limits: Limits = DEFAULT_LIMITS): CalculatorServer {
  return createCalculatorServerWithPool(limits, new WorkerPool(limits));
}

export function createCalculatorServerWithPool(
  limits: Limits,
  pool: Pick<WorkerPool, 'run'>,
): CalculatorServer {
  const app = fastify({
    logger: false,
    bodyLimit: limits.maxBodyBytes,
    requestTimeout: limits.wallTimeMs + 5000,
    keepAliveTimeout: 5000,
    connectionTimeout: 5000,
  });

  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_request, body, done) => {
    try {
      done(null, JSON.parse(body as string) as unknown);
    } catch {
      done(new Error('invalid JSON'));
    }
  });

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error.code?.startsWith('FST_ERR_CTP_') || error.message === 'invalid JSON') {
      return reply.code(statusCodes.invalid_input).send({
        status: 'invalid_input',
        error:
          error.code === 'FST_ERR_CTP_BODY_TOO_LARGE'
            ? 'body too large'
            : error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE'
              ? 'content-type must be application/json'
              : 'body must be an object',
      });
    }

    return reply.code(statusCodes.internal_failure).send({
      status: 'internal_failure',
      error: 'internal failure',
    });
  });

  app.get('/healthz', () => ({ status: 'success', result: 'ok' }));

  app.post<{ Body: unknown }>('/v1/calculate', async (request, reply) => {
    if (request.headers['content-type']?.split(';', 1)[0] !== 'application/json') {
      return reply.code(statusCodes.invalid_input).send({
        status: 'invalid_input',
        error: 'content-type must be application/json',
      });
    }

    const input = request.body;
    const validation = validateRequest(input, limits);
    if (!validation.valid) {
      return reply
        .code(statusCodes.invalid_input)
        .send({ status: 'invalid_input', error: validation.error });
    }

    const controller = new AbortController();
    const onRequestClose = () => {
      if (!request.raw.complete) {
        controller.abort();
      }
    };
    const onReplyClose = () => {
      if (!reply.raw.writableEnded) {
        controller.abort();
      }
    };
    request.raw.once('close', onRequestClose);
    reply.raw.once('close', onReplyClose);

    try {
      const result = await pool.run(validation.value.expression, {
        signal: controller.signal,
      });
      return reply.code(statusCodes[result.status]).send(result);
    } finally {
      request.raw.off('close', onRequestClose);
      reply.raw.off('close', onReplyClose);
    }
  });

  app.setNotFoundHandler((_request, reply) =>
    reply.code(statusCodes.invalid_input).send({ status: 'invalid_input', error: 'not found' }),
  );

  return app;
}
