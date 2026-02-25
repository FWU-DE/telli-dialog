import { handleApiError } from '@/errors';
import { organizationParamsSchema } from '../organizationParamsSchema';
import { validateAdminApiKeyAndThrow } from '@/validation';
import { dbGetAllModelsByOrganizationId } from '@telli/api-database';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);
    const { organizationId } = organizationParamsSchema.parse(request.params);

    const models = await dbGetAllModelsByOrganizationId(organizationId);
    reply.status(200).send(models);
  } catch (error) {
    const result = handleApiError(error);
    reply.status(result.statusCode).send({ error: result.message });
    return;
  }
}
