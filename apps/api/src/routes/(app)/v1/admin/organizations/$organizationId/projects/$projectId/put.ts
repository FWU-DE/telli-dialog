import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";
import {
  dbGetProjectById,
  dbUpdateProject,
  projectUpdateSchema,
} from "@telli/api-database";
import { FastifyReply, FastifyRequest } from "fastify";
import { projectParamsSchema } from "./projectParamsSchema";

const bodySchema = projectUpdateSchema.omit({
  id: true,
  organizationId: true,
  createdAt: true,
});

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId, projectId } = projectParamsSchema.parse(
      request.params,
    );
    const valuesToUpdate = bodySchema.parse(request.body);

    const project = await dbGetProjectById(organizationId, projectId);
    if (!project) {
      reply.status(404).send({ error: "Project not found" });
      return;
    }

    const updatedValues = { ...project, ...valuesToUpdate };

    const result = await dbUpdateProject(updatedValues);

    reply.status(200).send(result);
  } catch (error) {
    const e = handleApiError(error);
    reply.status(e.statusCode).send({ error: e.message });
    return;
  }
}
