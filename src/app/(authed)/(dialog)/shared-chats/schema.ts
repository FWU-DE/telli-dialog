import { z } from 'zod';

export const sharedSchoolChatFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  // modelId: z.string(),
  schoolType: z.string().min(1),
  gradeLevel: z.string().min(1),
  subject: z.string().min(1),
  learningContext: z.string().min(1),
  specification: z.string(),
  restrictions: z.string(),
});

export type SharedSchoolChatFormValues = z.infer<typeof sharedSchoolChatFormValuesSchema>;
