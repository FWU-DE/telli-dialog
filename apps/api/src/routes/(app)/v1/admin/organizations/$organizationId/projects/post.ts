import { FastifyReply, FastifyRequest } from "fastify";
import { dbCreateProject, projectInsertSchema } from "@telli/api-database";
import { handleApiError } from "@/errors";
import { validateAdminApiKeyAndThrow } from "@/validation";
import { organizationParamsSchema } from "../organizationParamsSchema";

const bodySchema = projectInsertSchema.omit({
  organizationId: true,
  createdAt: true,
});

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    validateAdminApiKeyAndThrow(request.headers.authorization);

    const { organizationId } = organizationParamsSchema.parse(request.params);
    const projectValues = bodySchema.parse(request.body);
    const projectToCreate = {
      organizationId,
      ...projectValues,
    };
    const createdProject = await dbCreateProject(projectToCreate);

    if (createdProject == undefined) {
      return reply.status(400).send({ error: "Could not create project." });
    }

    return reply.status(201).send(createdProject);
  } catch (error) {
    const result = handleApiError(error);
    return reply.status(result.statusCode).send({ error: result.message });
  }
}
