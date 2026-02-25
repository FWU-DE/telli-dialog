import { handleApiError } from '@/errors';
import { validateAdminApiKeyAndThrow } from '@/validation';
import { dbGetAllModelMappingsForApiKey } from '@telli/api-database';
import { FastifyReply, FastifyRequest } from 'fastify';
import { apiKeyParamsSchema } from '../apiKeyParamsSchema';

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);
    const { organizationId, projectId, apiKeyId } = apiKeyParamsSchema.parse(request.params);

    const models = await dbGetAllModelMappingsForApiKey(organizationId, projectId, apiKeyId);

    reply.status(200).send(models);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
