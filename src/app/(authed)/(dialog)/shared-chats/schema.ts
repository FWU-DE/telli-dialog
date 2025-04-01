import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { z } from 'zod';

export const sharedSchoolChatFormValuesSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  modelId: z.string(),
  schoolType: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  gradeLevel: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  subject: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  learningContext: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  specification: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  restrictions: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
});

export type SharedSchoolChatFormValues = z.infer<typeof sharedSchoolChatFormValuesSchema>;
