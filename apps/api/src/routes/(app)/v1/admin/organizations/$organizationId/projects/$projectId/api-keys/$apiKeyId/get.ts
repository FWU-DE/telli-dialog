import { FastifyReply, FastifyRequest } from "fastify";
import { dbGetApiKey } from "@telli/api-database";
import { apiKeyParamsSchema } from "./apiKeyParamsSchema";
import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId, apiKeyId } = apiKeyParamsSchema.parse(
      request.params,
    );

    const rawApiKey = await dbGetApiKey(organizationId, projectId, apiKeyId);

    if (rawApiKey === undefined) {
      return reply.status(404).send({ error: "API key not found" });
    }

    // remove secretHash and keyId from each api key before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { keyId, secretHash, ...apiKey } = rawApiKey;

    return reply.status(200).send(apiKey);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
