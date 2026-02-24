import { handleApiError } from "@/errors";
import { organizationParamsSchema } from "../organizationParamsSchema";
import {
  validateAdminApiKeyAndThrow,
  validateOrganizationId,
} from "@/validation";
import { dbGetAllProjectsByOrganizationId } from "@telli/api-database";
import { FastifyReply, FastifyRequest } from "fastify";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId } = organizationParamsSchema.parse(request.params);
    await validateOrganizationId(organizationId);

    const projects = await dbGetAllProjectsByOrganizationId(organizationId);
    reply.status(200).send(projects);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
