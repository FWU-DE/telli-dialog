import { FastifyReply, FastifyRequest } from "fastify";
import { validateAdminApiKey } from "../../../utils";
import { dbGetProjectsWithApiKeys } from "@telli/api-database";
import z from "zod";
import {
  convertToCSV,
  createMonthlyCostReports,
} from "@/routes/(app)/v1/admin/organizations/$organizationId/report/utils";

export async function handler(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const validationResult = validateAdminApiKey(request, reply);

  if (!validationResult.isValid) return;

  const { organizationId, year } = z
    .object({
      organizationId: z.string(),
      year: z.coerce.number().default(2025),
    })
    .parse(request.params);

  const { format } = z
    .object({ format: z.enum(["csv", "json"]).default("json") })
    .parse(request.query);

  const projects = await dbGetProjectsWithApiKeys({ organizationId });

  const report = await createMonthlyCostReports({ projects, year });

  if (format === "csv") {
    const csvString = convertToCSV(report);
    reply.status(200).send(csvString);
    return;
  }

  return reply.status(200).send({ report });
}
