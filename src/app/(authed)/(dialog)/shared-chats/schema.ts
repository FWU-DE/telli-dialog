import { SMALL_TEXT_INPUT_FIELDS_LIMIT, TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { z } from 'zod';
export const sharedSchoolChatFormValuesSchema = z.object({
  name: z.string().min(1).max(SMALL_TEXT_INPUT_FIELDS_LIMIT),
  description: z.string().min(1).max(SMALL_TEXT_INPUT_FIELDS_LIMIT),
  modelId: z.string(),
  schoolType: z.string().max(SMALL_TEXT_INPUT_FIELDS_LIMIT).nullable(),
  gradeLevel: z.string().max(SMALL_TEXT_INPUT_FIELDS_LIMIT).nullable(),
  subject: z.string().max(SMALL_TEXT_INPUT_FIELDS_LIMIT).nullable(),
  learningContext: z.string().min(1).max(TEXT_INPUT_FIELDS_LENGTH_LIMIT),
  specification: z.string().max(TEXT_INPUT_FIELDS_LENGTH_LIMIT).nullable(),
  restrictions: z.string().max(TEXT_INPUT_FIELDS_LENGTH_LIMIT).nullable(),
  attachedLinks: z.array(
    z.object({
      type: z.literal('websearch'),
      name: z.string(),
      link: z.string(),
      content: z.string(),
      hostname: z.string().optional(),
      error: z.boolean().optional(),
    }),
  ),
});

export type SharedSchoolChatFormValues = z.infer<typeof sharedSchoolChatFormValuesSchema>;
