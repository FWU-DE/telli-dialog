import { z } from 'zod';

export const conversationRoleSchema = z.enum(['user', 'assistant', 'system', 'data']);
export type ConversationRole = z.infer<typeof conversationRoleSchema>;

const fileMetadataSchema = z.object({
  fileId: z.string(),
  fileName: z.string(),
  size: z.number(),
});
export type FileMetadata = z.infer<typeof fileMetadataSchema>;

const conversationMessageMetadataSchema = z.object({
  files: z.array(fileMetadataSchema),
  directories: z.array(z.string()).optional().nullable(),
  integrations: z.array(z.string()).optional().nullable(),
});
export type ConversationMessageMetadata = z.infer<typeof conversationMessageMetadataSchema>;

export const conversationMessageSchema = z.object({
  content: z.string(),
  role: conversationRoleSchema,
  metadata: conversationMessageMetadataSchema.optional().nullable(),
});
export type ConversationMessage = z.infer<typeof conversationMessageSchema>;
