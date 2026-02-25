import { FastifyReply, FastifyRequest } from 'fastify';
import { dbGetProjectById } from '@telli/api-database';
import { projectParamsSchema } from './projectParamsSchema';
import { handleApiError } from '@/errors';
import { validateAdminApiKeyAndThrow } from '@/validation';

export async function handler(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId } = projectParamsSchema.parse(request.params);
    const project = await dbGetProjectById(organizationId, projectId);

    if (project === undefined) {
      return reply.status(404).send({ error: 'Project not found' });
    }

    return reply.status(200).send(project);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
