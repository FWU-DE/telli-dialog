import z from "zod";

export const organizationParamsSchema = z.object({
  organizationId: z.string().uuid(),
});
