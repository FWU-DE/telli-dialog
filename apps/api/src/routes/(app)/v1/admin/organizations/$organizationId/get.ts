import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetOrganizationById } from "@telli/api-database";
import { organizationParamsSchema } from "./organizationParamsSchema";
import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId } = organizationParamsSchema.parse(request.params);

    const organization = await dbGetOrganizationById(organizationId);

    if (organization === undefined) {
      return reply.status(404).send({ error: "Organization not found" });
    }

    return reply.status(200).send(organization);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
