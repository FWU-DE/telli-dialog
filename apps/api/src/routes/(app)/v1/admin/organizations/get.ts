import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetAllOrganizations } from "@telli/api-database";
import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const organizations = await dbGetAllOrganizations();

    return reply.status(200).send(organizations);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
