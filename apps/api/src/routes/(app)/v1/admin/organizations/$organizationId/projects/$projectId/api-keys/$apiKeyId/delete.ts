import { FastifyReply, FastifyRequest } from 'fastify';
import { dbDeleteApiKey, dbGetApiKey } from '@telli/api-database';
import { handleApiError, NotFoundError } from '@/errors';
import { validateAdminApiKeyAndThrow } from '@/validation';
import { apiKeyParamsSchema } from './apiKeyParamsSchema';

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId, apiKeyId } = apiKeyParamsSchema.parse(request.params);

    const apiKey = dbGetApiKey(organizationId, projectId, apiKeyId);
    if (apiKey === undefined) {
      throw new NotFoundError('API key not found');
    }

    await dbDeleteApiKey(apiKeyId);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
