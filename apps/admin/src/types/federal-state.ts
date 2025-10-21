import { DesignConfigurationSchema } from '@ui/types/design-configuration';
import { z } from 'zod';

export const FederalStateSchema = z.object({
  id: z.string().readonly(),
  teacherPriceLimit: z.number(),
  studentPriceLimit: z.number(),
  createdAt: z.string(),
  mandatoryCertificationTeacher: z.boolean(),
  chatStorageTime: z.number(),
  supportContacts: z.array(z.string()),
  trainingLink: z.string(),
  designConfiguration: DesignConfigurationSchema.nullable(),
  telliName: z.string().optional(),
  studentAccess: z.boolean(),
  enableCharacter: z.boolean(),
  enableSharedChats: z.boolean(),
  enableCustomGpt: z.boolean(),
  hasApiKeyAssigned: z.boolean(),
});

export type FederalState = z.infer<typeof FederalStateSchema>;

export const FederalStateEditSchema = FederalStateSchema.extend({
  supportContacts: z.array(
    z.object({
      value: z.string(),
    }),
  ),
  designConfiguration: z.string(), // Will be parsed as JSON before submitting
});

export type FederalStateEdit = z.infer<typeof FederalStateEditSchema>;
