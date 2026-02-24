import { FastifyReply, FastifyRequest } from "fastify";
import { dbUpdateLlmModel, llmUpdateModelSchema } from "@telli/api-database";
import { validateAdminApiKeyAndThrow, validateRequestBody } from "@/validation";
import { handleApiError, NotFoundError } from "@/errors";
import { validateOrganizationId } from "@/validation";
import { modelParamsSchema } from "./modelParamsSchema";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);
    const { id, organizationId } = modelParamsSchema.parse(request.params);
    const parseResult = llmUpdateModelSchema.parse(request.body);
    await validateOrganizationId(organizationId);
    validateRequestBody(parseResult);

    const dbResult = await dbUpdateLlmModel(id, organizationId, parseResult);
    if (!dbResult) throw new NotFoundError("Model not found");
    return reply.status(200).send(dbResult);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
