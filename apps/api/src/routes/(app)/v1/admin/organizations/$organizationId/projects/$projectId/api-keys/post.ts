import { FastifyReply, FastifyRequest } from 'fastify';
import { apiKeyInsertSchema, dbCreateJustTheApiKey } from '@telli/api-database';
import { validateAdminApiKeyAndThrow } from '@/validation';
import { projectParamsSchema } from '../projectParamsSchema';
import { handleApiError } from '@/errors';

const bodySchema = apiKeyInsertSchema.omit({
  createdAt: true,
  id: true,
  keyId: true,
  projectId: true,
  secretHash: true,
});

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId } = projectParamsSchema.parse(request.params);
    const apiKeyValues = bodySchema.parse(request.body);
    const apiKeyToCreate = {
      organizationId,
      projectId,
      ...apiKeyValues,
    };

    const apiKey = await dbCreateJustTheApiKey(apiKeyToCreate);

    return reply.status(201).send(apiKey);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
