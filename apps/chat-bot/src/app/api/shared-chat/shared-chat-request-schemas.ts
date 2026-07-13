import { z } from 'zod';

const requiredNonEmptyString = (message: string) =>
  z
    .custom<string>((value) => typeof value === 'string' && value.trim() !== '', {
      message,
    })
    .transform((value) => value.trim());

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined),
  z.string().optional(),
);

export const sharedChatCommonRequestSchema = z.object({
  inviteCode: requiredNonEmptyString('inviteCode is required'),
  sharedSessionId: requiredNonEmptyString('sharedSessionId is required'),
  characterId: optionalNonEmptyString,
  learningScenarioId: optionalNonEmptyString,
});

export const sharedChatUploadFormSchema = sharedChatCommonRequestSchema.extend({
  file: z.custom<File>((value) => value instanceof File, {
    message: 'Invalid or missing file in form data',
  }),
});

export const sharedChatSignedUrlRequestSchema = sharedChatCommonRequestSchema.extend({
  fileId: requiredNonEmptyString('fileId is required'),
});
