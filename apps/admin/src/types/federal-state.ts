import { z } from 'zod';

export const FederalStateSchema = z.object({
  id: z.string(),
  teacherPriceLimit: z.number(),
  studentPriceLimit: z.number(),
  createdAt: z.string(),
  mandatoryCertificationTeacher: z.boolean(),
  chatStorageTime: z.number(),
  supportContacts: z.array(z.string()),
  trainingLink: z.string(),
  designConfiguration: z.string(),
  telliName: z.string(),
  studentAccess: z.boolean(),
  enableCharacter: z.boolean(),
  enableSharedChats: z.boolean(),
  enableCustomGpt: z.boolean(),
});

export type FederalState = z.infer<typeof FederalStateSchema>;
