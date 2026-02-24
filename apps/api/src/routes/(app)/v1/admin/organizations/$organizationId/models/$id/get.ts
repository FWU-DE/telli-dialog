import { handleApiError } from "@/errors";
import { dbGetModelById } from "@telli/api-database";
import { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminApiKeyAndThrow } from "@/validation";
import { modelParamsSchema } from "./modelParamsSchema";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { id } = modelParamsSchema.parse(request.params);

    const model = await dbGetModelById(id);

    reply.status(200).send(model);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
