import z from "zod";
import { organizationParamsSchema } from "../../organizationParamsSchema";

export const modelParamsSchema = organizationParamsSchema.extend({
  id: z.string().uuid(),
});
