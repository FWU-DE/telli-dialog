import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
  unique,
  json,
  boolean,
  vector,
  customType,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { DesignConfiguration, type LlmModelPriceMetadata } from './types';
import { conversationRoleSchema } from '@/utils/chat';
import { sql } from 'drizzle-orm';

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return `tsvector`;
  },
});

// can be expanded to include other metadata of other file types
export type FileMetadata = {
  width?: number;
  height?: number;
};

export const userTable = pgTable('user_entity', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  lastUsedModel: text('last_used_model'),
  versionAcceptedConditions: integer(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export type InsertUserModel = typeof userTable.$inferInsert;
export type UserModel = typeof userTable.$inferSelect;

export const conversationTable = pgTable('conversation', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  userId: uuid('user_id')
    .references(() => userTable.id)
    .notNull(),
  characterId: uuid('character_id').references(() => characterTable.id),
  customGptId: uuid('custom_gpt_id').references(() => customGptTable.id),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
});

export const conversationRoleEnum = pgEnum('conversation_role', conversationRoleSchema.options);

export const conversationMessageTable = pgTable('conversation_message', {
  id: uuid('id').defaultRandom().primaryKey(),
  content: text('content').notNull(),
  conversationId: uuid('conversation_id')
    .references(() => conversationTable.id)
    .notNull(),
  modelName: text('model_name'),
  userId: uuid('user_id').references(() => userTable.id),
  role: conversationRoleEnum('role').notNull(),
  orderNumber: integer('order_number').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
});

export type ConversationModelWithFiles = typeof conversationTable.$inferSelect & {
  files: FileModel[];
};

export const userSchoolRoleSchema = z.enum(['student', 'teacher']);
export const userSchoolRoleEnum = pgEnum('user_school_role', userSchoolRoleSchema.options);
export type UserSchoolRole = z.infer<typeof userSchoolRoleSchema>;

export const userSchoolMappingTable = pgTable(
  'user_school_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => userTable.id)
      .notNull(),
    schoolId: text('school_id')
      .references(() => schoolTable.id)
      .notNull(),
    role: userSchoolRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.userId, table.schoolId),
  }),
);

export const schoolTable = pgTable('school', {
  id: text('id').primaryKey(),
  federalStateId: text('federal_state_id')
    .references(() => federalStateTable.id)
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export type SchoolInsertModel = typeof schoolTable.$inferInsert;
export type SchoolModel = typeof schoolTable.$inferSelect;

export const federalStateTable = pgTable('federal_state', {
  id: text('id').primaryKey(),
  teacherPriceLimit: integer('teacher_price_limit').notNull().default(500),
  studentPriceLimit: integer('student_price_limit').notNull().default(200),
  encryptedApiKey: text('encrypted_api_key'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  // vidis things
  mandatoryCertificationTeacher: boolean('mandatory_certification_teacher').default(false),
  chatStorageTime: integer('chat_storage_time').notNull().default(120),
  supportContacts: json('support_contacts').$type<string[]>(),
  trainingLink: text('training_link'),
  // whitelabel configuration
  designConfiguration: json('design_configuration').$type<DesignConfiguration>(),
  telliName: text('telli_name'),
  // feature flags
  studentAccess: boolean('student_access').default(true).notNull(),
  enableCharacter: boolean('enable_characters').default(true).notNull(),
  enableSharedChats: boolean('enable_shared_chats').default(true).notNull(),
  enableCustomGpt: boolean('enable_custom_gpts').default(true).notNull(),
});

export type FederalStateInsertModel = typeof federalStateTable.$inferInsert;
export type FederalStateModel = typeof federalStateTable.$inferSelect;

export const characterAccessLevelSchema = z.enum(['private', 'school', 'global']);
export const characterAccessLevelEnum = pgEnum(
  'character_access_level',
  characterAccessLevelSchema.options,
);
export type CharacterAccessLevel = z.infer<typeof characterAccessLevelSchema>;

export const characterTable = pgTable('character', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => userTable.id)
    .notNull(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => llmModelTable.id),
  // required
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  learningContext: text('learning_context').notNull().default(''),
  competence: text('competence').notNull().default(''),
  // new
  schoolType: text('school_type'),
  gradeLevel: text('grade_level'),
  subject: text('subject'),
  // not required
  specifications: text('specifications'),
  restrictions: text('restrictions'),
  pictureId: text('picture_id'),
  initialMessage: text('initial_message'),
  accessLevel: characterAccessLevelEnum('access_level').notNull().default('private'),
  schoolId: text('school_id').references(() => schoolTable.id),
  // for sharing the character. These Columns are unused, instead a MappingTable is being used
  intelligencePointsLimit: integer('intelligence_points_limit'),
  maxUsageTimeLimit: integer('max_usage_time_limit'),
  inviteCode: text('invite_code').unique(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  attachedLinks: text('attached_links')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
});

export type CharacterInsertModel = typeof characterTable.$inferInsert;
export type CharacterModel = typeof characterTable.$inferSelect;

export const llmModelTypeSchema = z.enum(['text', 'image', 'fc']);
export const llmModelTypeEnum = pgEnum('llm_model_type', llmModelTypeSchema.options);
export type LlmModeType = z.infer<typeof llmModelTypeSchema>;

export const llmModelTable = pgTable(
  'llm_model',
  {
    id: uuid('id').primaryKey(),
    provider: text('owner').notNull(),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description').notNull().default(''),
    priceMetadata: json('price_metada').$type<LlmModelPriceMetadata>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    supportedImageFormats: json('supported_image_formats').$type<string[]>(),
    isNew: boolean('is_new').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
  },
  (table) => ({
    unq: unique().on(table.provider, table.name),
  }),
);

export const federalStateLlmModelMappingTable = pgTable(
  'federal_state_llm_model_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    federalStateId: text('federal_state_id')
      .references(() => federalStateTable.id)
      .notNull(),
    llmModelId: uuid('llm_model_id')
      .references(() => llmModelTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.federalStateId, table.llmModelId),
  }),
);

export type LlmInsertModel = typeof llmModelTable.$inferInsert;
export type LlmModel = typeof llmModelTable.$inferSelect;

export const sharedSchoolConversationTable = pgTable('shared_school_conversation', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  modelId: uuid('model_id')
    .notNull()
    .references(() => llmModelTable.id),
  userId: uuid('user_id')
    .references(() => userTable.id)
    .notNull(),
  schoolType: text('school_type'),
  gradeLevel: text('grade_level'),
  subject: text('subject'),
  studentExcercise: text('student_excercise').default('').notNull(),
  additionalInstructions: text('additional_instructions'),
  restrictions: text('restrictions'), // Not used anymore
  intelligencePointsLimit: integer('intelligence_points_limit'),
  maxUsageTimeLimit: integer('max_usage_time_limit'),
  attachedLinks: text('attached_links')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  pictureId: text('picture_id'),
  inviteCode: text('invite_code').unique(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});
export type SharedSchoolConversationInsertModel = typeof sharedSchoolConversationTable.$inferInsert;
export type SharedSchoolConversationModel = typeof sharedSchoolConversationTable.$inferSelect;

export const sharedSchoolConversationUsageTracking = pgTable(
  'shared_school_conversation_usage_tracking',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => llmModelTable.id),
    sharedSchoolConversationId: uuid('shared_school_conversation_id').notNull(),
    userId: uuid('user_id').notNull(),
    completionTokens: integer('completion_tokens').notNull(),
    promptTokens: integer('prompt_tokens').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
);
export type SharedSchoolConversationUsageTrackingInsertModel =
  typeof sharedSchoolConversationUsageTracking.$inferInsert;
export type SharedSchoolConversationUsageTrackingModel =
  typeof sharedSchoolConversationUsageTracking.$inferSelect;

export const conversationUsageTracking = pgTable('conversation_usage_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  modelId: uuid('model_id')
    .notNull()
    .references(() => llmModelTable.id),
  // this rows will be kept forever even if conversations are deleted, therefore we cannot enforce a foreign key constaint here
  conversationId: uuid('conversation_id').notNull(),
  // for easier tracking we add a user_id here to make less joins as this table will contain a lot of entries
  // this is not database normalization conform tho, we need to keep these rows forever too
  userId: uuid('user_id').notNull(),
  completionTokens: integer('completion_tokens').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});
export type ConversationUsageTrackingInsertModel = typeof conversationUsageTracking.$inferInsert;
export type ConversationUsageTrackingModel = typeof conversationUsageTracking.$inferSelect;

export const sharedCharacterConversation = pgTable(
  'shared_character_conversation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    characterId: uuid('character_id').notNull(),
    userId: uuid('user_id')
      .references(() => userTable.id)
      .notNull(),
    intelligencePointsLimit: integer('intelligence_points_limit'),
    maxUsageTimeLimit: integer('max_usage_time_limit'),
    inviteCode: text('invite_code').unique(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.characterId, table.userId),
  }),
);

// export type sharedCharacterConversation = typeof sharedCharacterConversation.$inferSelect;

export const sharedCharacterChatUsageTrackingTable = pgTable(
  'shared_character_chat_usage_tracking',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => llmModelTable.id),
    characterId: uuid('character_id').notNull(),
    userId: uuid('user_id').notNull(),
    completionTokens: integer('completion_tokens').notNull(),
    promptTokens: integer('prompt_tokens').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
);
export type SharedCharacterChatUsageTrackingInsertModel =
  typeof sharedCharacterChatUsageTrackingTable.$inferInsert;
export type SharedCharacterChatUsageTrackingModel =
  typeof sharedCharacterChatUsageTrackingTable.$inferSelect;

export const customGptTable = pgTable('custom_gpt', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  systemPrompt: text('system_prompt').notNull(),
  userId: uuid('user_id').references(() => userTable.id),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  schoolId: text('school_id').references(() => schoolTable.id),
  accessLevel: characterAccessLevelEnum('access_level').notNull().default('private'),
  pictureId: text('picture_id'),
  description: text('description'),
  specification: text('specification'),
  promptSuggestions: text('prompt_suggestions')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  attachedLinks: text('attached_links')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
});

export type CustomGptModel = typeof customGptTable.$inferSelect;
export type CustomGptInsertModel = typeof customGptTable.$inferInsert;

export const fileTable = pgTable('file_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  metadata: json('metadata').$type<FileMetadata>(),
});
export type FileModel = typeof fileTable.$inferSelect;
export type FileModelAndUrl = FileModel & { signedUrl: string };
export type FileModelAndContent = FileModel & { content?: string };
export type FileInsertModel = typeof fileTable.$inferInsert;

export const ConversationMessageFileMappingTable = pgTable(
  'conversation_message_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('fileId')
      .references(() => fileTable.id)
      .notNull(),
    conversationMessageId: uuid('conversationMessageId')
      .references(() => conversationMessageTable.id)
      .notNull(),
    // technically redundant but there files and conversations should be unique and it makes clean-up easier
    conversationId: uuid('conversationId')
      .references(() => conversationTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.conversationId, table.fileId),
  }),
);

export const SharedSchoolConversationFileMapping = pgTable(
  'shared_conversation_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('fileId')
      .references(() => fileTable.id)
      .notNull(),
    sharedSchoolConversationId: uuid('shared_school_conversation_id')
      .references(() => sharedSchoolConversationTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.sharedSchoolConversationId, table.fileId),
  }),
);

export const CharacterFileMapping = pgTable(
  'character_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id)
      .notNull(),
    characterId: uuid('character_id')
      .references(() => characterTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.characterId, table.fileId),
  }),
);
export const CustomGptFileMapping = pgTable(
  'custom_gpt_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id)
      .notNull(),
    customGptId: uuid('custom_gpt_id')
      .references(() => customGptTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    unq: unique().on(table.customGptId, table.fileId),
  }),
);

export const TextChunkTable = pgTable(
  'text_chunk',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id)
      .notNull(),
    embedding: vector('embedding', { dimensions: 1024 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    content: text('content').notNull(),
    leadingOverlap: text('leading_overlap'),
    trailingOverlap: text('trailing_overlap'),
    orderIndex: integer('order_index').notNull(),
    pageNumber: integer('page_number'),
    contentTsv: tsvector('content_tsv')
      .notNull()
      .generatedAlwaysAs(sql`to_tsvector('german', content)`),
  },
  () => {
    return {
      embeddingIdx: sql`CREATE INDEX IF NOT EXISTS text_chunk_embedding_idx ON text_chunk USING hnsw (embedding vector_cosine_ops)`,
      contentTsvIdx: sql`CREATE INDEX IF NOT EXISTS text_chunk_content_tsv_idx ON text_chunk USING GIN (contentTsv)`,
    };
  },
);

export type TextChunkModel = typeof TextChunkTable.$inferSelect;
export type TextChunkInsertModel = typeof TextChunkTable.$inferInsert;

export const codeStatus = z.enum(['active', 'used', 'revoked']);
export const codeStatusEnum = pgEnum('code_status', codeStatus.options);

export const CodeTable = pgTable('code', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  increase_amount: integer('increase_amount').notNull(),
  duration_months: integer('duration_months').notNull(),
  status: codeStatusEnum('status').notNull().default('active'),
  valid_until: timestamp('valid_until', { mode: 'date', withTimezone: true }).notNull(),
  federalStateId: text('federal_state_id')
    .references(() => federalStateTable.id)
    .notNull(),
  redeemedBy: uuid('redeemed_by').references(() => userTable.id),
  redeemedAt: timestamp('redeemed_at', { mode: 'date', withTimezone: true }),
  createdBy: uuid('created_by').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  create_reason: text('create_reason').notNull().default(''),
  updatedBy: uuid('updated_by').references(() => userTable.id),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }),
  update_reason: text('update_reason').notNull().default(''),
});

export type CodeModel = typeof CodeTable.$inferSelect;
export type CodeInsertModel = typeof CodeTable.$inferInsert;
