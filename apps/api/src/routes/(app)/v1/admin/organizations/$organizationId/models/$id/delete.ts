import { handleApiError } from "@/errors";
import { modelParamsSchema } from "./modelParamsSchema";
import { validateAdminApiKeyAndThrow } from "@/validation";
import { dbDeleteLlmModelById } from "@telli/api-database";
import { FastifyReply, FastifyRequest } from "fastify";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { id } = modelParamsSchema.parse(request.params);

    await dbDeleteLlmModelById(id);

    reply.status(200).send();
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
