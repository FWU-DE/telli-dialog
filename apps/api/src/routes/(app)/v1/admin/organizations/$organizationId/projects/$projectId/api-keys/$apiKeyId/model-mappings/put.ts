import { handleApiError } from '@/errors';
import { apiKeyParamsSchema } from '../apiKeyParamsSchema';
import { validateAdminApiKeyAndThrow } from '@/validation';
import { dbUpdateModelMappingsForApiKey } from '@telli/api-database';
import { FastifyReply, FastifyRequest } from 'fastify';
import z from 'zod';

const bodySchema = z.object({
  modelIds: z.array(z.string().uuid()),
});

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId, apiKeyId } = apiKeyParamsSchema.parse(request.params);
    const { modelIds } = bodySchema.parse(request.body);

    const updatedMappings = await dbUpdateModelMappingsForApiKey(
      organizationId,
      projectId,
      apiKeyId,
      modelIds,
    );

    reply.status(200).send(updatedMappings);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
