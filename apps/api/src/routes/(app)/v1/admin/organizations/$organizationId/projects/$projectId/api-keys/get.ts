import { validateAdminApiKeyAndThrow } from '@/validation';
import { dbGetAllApiKeysByProjectId } from '@telli/api-database';
import { FastifyReply, FastifyRequest } from 'fastify';
import { projectParamsSchema } from '../projectParamsSchema';
import { handleApiError } from '@/errors';

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId } = projectParamsSchema.parse(request.params);

    const rawApiKeys = await dbGetAllApiKeysByProjectId(organizationId, projectId);

    // remove secretHash and keyId from each api key before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const apiKeys = rawApiKeys.map(({ keyId, secretHash, ...rest }) => rest);

    reply.status(200).send(apiKeys);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
