import { FastifyReply, FastifyRequest } from "fastify";
import { obscureModels } from "../../../../models/utils";
import { dbCreateLlmModel, llmInsertModelSchema } from "@telli/api-database";
import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const modelToCreate = llmInsertModelSchema.parse(request.body);
    const createdModel = await dbCreateLlmModel(modelToCreate);

    if (createdModel == undefined) {
      return reply.status(400).send({ error: "Could not create model." });
    }

    return reply.status(200).send(obscureModels([createdModel])[0]);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
