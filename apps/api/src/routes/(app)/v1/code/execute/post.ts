import {
  CodeExecutionCapacityError,
  executeCode,
  codeExecutionRequestSchema,
} from '@/code-execution';
import { validateApiKey } from '@/routes/utils';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if ((await validateApiKey(request, reply)) === undefined) return;
  const parsed = codeExecutionRequestSchema.safeParse(request.body);
  if (!parsed.success) {
    reply.status(400).send({ error: 'Bad request', details: parsed.error.message });
    return;
  }
  try {
    reply.status(200).send(await executeCode(parsed.data));
  } catch (error) {
    if (error instanceof CodeExecutionCapacityError) {
      reply.status(429).send({ error: 'Code execution capacity reached' });
      return;
    }
    reply.status(502).send({ error: 'Code execution service unavailable' });
  }
}
