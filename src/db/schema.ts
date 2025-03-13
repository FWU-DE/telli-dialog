import { pgTable, text, timestamp, uuid, pgEnum, integer, unique, json } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { type LlmModelPriceMetadata } from './types';
import { conversationRoleSchema } from '@/utils/chat';

export const userTable = pgTable('user_entity', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
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
  schoolType: text('school_type').notNull().default(''),
  gradeLevel: text('grade_level').notNull().default(''),
  subject: text('subject').default('').notNull(),
  // not required
  specifications: text('specifications'),
  restrictions: text('restrictions'),
  pictureId: text('picture_id'),
  accessLevel: characterAccessLevelEnum('access_level').notNull().default('private'),
  schoolId: text('school_id').references(() => schoolTable.id),
  // for sharing the character
  intelligencePointsLimit: integer('intelligence_points_limit'),
  maxUsageTimeLimit: integer('max_usage_time_limit'),
  inviteCode: text('invite_code').unique(),
  startedAt: timestamp('started_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
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
  schoolType: text('school_type').notNull().default(''),
  gradeLevel: text('grade_level').notNull().default(''),
  subject: text('subject').default('').notNull(),
  learningContext: text('learning_context').default('').notNull(),
  specification: text('specification').default('').notNull(),
  restrictions: text('restrictions').default('').notNull(),
  intelligencePointsLimit: integer('intelligence_points_limit'),
  maxUsageTimeLimit: integer('max_usage_time_limit'),
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
});

export type CustomGptModel = typeof customGptTable.$inferSelect;
export type CustomGptInsertModel = typeof customGptTable.$inferInsert;
