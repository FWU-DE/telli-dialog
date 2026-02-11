import {
  boolean,
  customType,
  doublePrecision,
  foreignKey,
  index,
  integer,
  json,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { DesignConfiguration, type LlmModelPriceMetadata, type WebsearchSource } from './types';
import {
  conversationRoleSchema,
  conversationTypeSchema,
  imageStyleTypeSchema,
} from '../utils/chat';
import { isNull, sql } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema, createUpdateSchema } from 'drizzle-zod';

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

/**
 * Schema for table user_entity
 */
export const userTable = pgTable('user_entity', {
  id: uuid('id').defaultRandom().primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  lastUsedModel: text('last_used_model'),
  versionAcceptedConditions: integer(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
});

export const userSelectSchema = createSelectSchema(userTable).extend({
  createdAt: z.coerce.date(),
});
export const userInsertSchema = createInsertSchema(userTable).omit({ createdAt: true, id: true });
export const userUpdateSchema = createUpdateSchema(userTable).omit({ createdAt: true }).extend({
  id: z.string(),
});

export type UserSelectModel = z.infer<typeof userSelectSchema>;
export type UserInsertModel = z.infer<typeof userInsertSchema>;
export type UserUpdateModel = z.infer<typeof userUpdateSchema>;

/**
 * Schema for table conversation
 */
export const conversationTypeEnum = pgEnum('conversation_type', conversationTypeSchema.enum);
export const conversationTable = pgTable(
  'conversation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name'),
    userId: uuid('user_id')
      .references(() => userTable.id)
      .notNull(),
    characterId: uuid('character_id').references(() => characterTable.id),
    customGptId: uuid('custom_gpt_id').references(() => customGptTable.id),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
    type: conversationTypeEnum('type').notNull().default('chat'),
  },
  (table) => [
    index().on(table.userId),
    index().on(table.characterId),
    index().on(table.customGptId),
    index().on(table.userId, table.createdAt.desc()).where(isNull(table.deletedAt)),
  ],
);

export const conversationSelectSchema = createSelectSchema(conversationTable);
export const conversationInsertSchema = createInsertSchema(conversationTable).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});
export const conversationUpdateSchema = createUpdateSchema(conversationTable)
  .omit({
    createdAt: true,
  })
  .extend({
    id: z.string(),
  });

export type ConversationSelectModel = z.infer<typeof conversationSelectSchema>;
export type ConversationInsertModel = z.infer<typeof conversationInsertSchema>;
export type ConversationUpdateModel = z.infer<typeof conversationUpdateSchema>;

export type ConversationModelWithFiles = ConversationSelectModel & {
  files: FileModel[];
};

/**
 * Schema for table conversation_message
 */
export const conversationRoleEnum = pgEnum('conversation_role', conversationRoleSchema.enum);

// Define the parameters type for conversation messages
export const conversationMessageParametersSchema = z.object({
  imageStyle: imageStyleTypeSchema.optional(),
});

export type ConversationMessageParameters = z.infer<typeof conversationMessageParametersSchema>;

export const conversationMessageTable = pgTable(
  'conversation_message',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    content: text('content').notNull(),
    conversationId: uuid('conversation_id')
      .references(() => conversationTable.id)
      .notNull(),
    modelName: text('model_name').notNull(),
    userId: uuid('user_id')
      .references(() => userTable.id)
      .notNull(),
    role: conversationRoleEnum('role').notNull(),
    orderNumber: integer('order_number').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { mode: 'date', withTimezone: true }),
    parameters: json('parameters').$type<ConversationMessageParameters>(),
    websearchSources: json('websearch_sources').$type<WebsearchSource[]>().notNull().default([]),
  },
  (table) => [index().on(table.conversationId), index().on(table.userId)],
);

export const conversationMessageSelectSchema = createSelectSchema(conversationMessageTable);
export const conversationMessageInsertSchema = createInsertSchema(conversationMessageTable).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});
export const conversationMessageUpdateSchema = createUpdateSchema(conversationMessageTable)
  .omit({
    createdAt: true,
    conversationId: true,
    userId: true,
  })
  .extend({
    id: z.string(),
  });

export type ConversationMessageSelectModel = z.infer<typeof conversationMessageSelectSchema>;
export type ConversationMessageInsertModel = z.infer<typeof conversationMessageInsertSchema>;
export type ConversationMessageUpdateModel = z.infer<typeof conversationMessageUpdateSchema>;

/**
 * Schema for table user_school_mapping
 */
export const userSchoolRoleSchema = z.enum(['student', 'teacher']);
export const userSchoolRoleEnum = pgEnum('user_school_role', userSchoolRoleSchema.enum);
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
  (table) => [unique().on(table.userId, table.schoolId)],
);

export const userSchoolMappingSelectSchema = createSelectSchema(userSchoolMappingTable);
export const userSchoolMappingInsertSchema = createInsertSchema(userSchoolMappingTable).omit({
  id: true,
  createdAt: true,
});
export const userSchoolMappingUpdateSchema = createUpdateSchema(userSchoolMappingTable)
  .omit({
    userId: true,
    schoolId: true,
    createdAt: true,
  })
  .extend({
    id: z.string(),
  });

export type UserSchoolMappingSelectModel = z.infer<typeof userSchoolMappingSelectSchema>;
export type UserSchoolMappingInsertModel = z.infer<typeof userSchoolMappingInsertSchema>;
export type UserSchoolMappingUpdateModel = z.infer<typeof userSchoolMappingUpdateSchema>;

/**
 * Schema for table school
 */
export const schoolTable = pgTable(
  'school',
  {
    id: text('id').primaryKey(),
    federalStateId: text('federal_state_id')
      .references(() => federalStateTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index().on(table.federalStateId)],
);

export const schoolSelectSchema = createSelectSchema(schoolTable).extend({
  createdAt: z.coerce.date(),
});
export const schoolInsertSchema = createInsertSchema(schoolTable).omit({
  createdAt: true,
});
export const schoolUpdateSchema = createUpdateSchema(schoolTable).omit({ createdAt: true }).extend({
  id: z.string(),
});

export type SchoolSelectModel = z.infer<typeof schoolSelectSchema>;
export type SchoolInsertModel = z.infer<typeof schoolInsertSchema>;
export type SchoolUpdateModel = z.infer<typeof schoolUpdateSchema>;

/**
 * Schema for table federal_state
 */
export const federalStateFeatureTogglesSchema = z.object({
  isStudentAccessEnabled: z.boolean().default(true),
  isCharacterEnabled: z.boolean().default(true),
  isSharedChatEnabled: z.boolean().default(true),
  isCustomGptEnabled: z.boolean().default(true),
  isShareTemplateWithSchoolEnabled: z.boolean().default(true),
  isImageGenerationEnabled: z.boolean().optional(),
});

export type FederalStateFeatureToggles = z.infer<typeof federalStateFeatureTogglesSchema>;

export const federalStateTable = pgTable('federal_state', {
  id: text('id').primaryKey(),
  teacherPriceLimit: integer('teacher_price_limit').notNull().default(500),
  studentPriceLimit: integer('student_price_limit').notNull().default(200),
  encryptedApiKey: text('encrypted_api_key'), // This will stay until we have migrated all usages to apiKeyId
  apiKeyId: uuid('api_key_id'),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  // vidis things
  mandatoryCertificationTeacher: boolean('mandatory_certification_teacher').default(false),
  chatStorageTime: integer('chat_storage_time').notNull().default(120),
  supportContacts: json('support_contacts').$type<string[]>(),
  trainingLink: text('training_link'),
  // whitelabel configuration
  designConfiguration: json('design_configuration').$type<DesignConfiguration>(),
  telliName: text('telli_name'),
  // feature toggles
  featureToggles: json('feature_toggles').$type<FederalStateFeatureToggles>().notNull(),
});
export const federalStateSelectSchema = createSelectSchema(federalStateTable).extend({
  id: z.string(),
  createdAt: z.coerce.date(),
});
export const federalStateInsertSchema = createInsertSchema(federalStateTable)
  .extend({
    featureToggles: federalStateFeatureTogglesSchema,
  })
  .omit({ createdAt: true });
export const federalStateUpdateSchema = createUpdateSchema(federalStateTable)
  .omit({
    createdAt: true,
  })
  .extend({
    id: z.string(),
  });

export type FederalStateSelectModel = z.infer<typeof federalStateSelectSchema>;
export type FederalStateInsertModel = z.infer<typeof federalStateInsertSchema>;
export type FederalStateUpdateModel = z.infer<typeof federalStateUpdateSchema>;

/**
 * Schema for table character
 */
export const accessLevelSchema = z.enum(['private', 'school', 'global']);
export const accessLevelEnum = pgEnum('access_level', accessLevelSchema.enum);
export type AccessLevel = z.infer<typeof accessLevelSchema>;

export const characterTable = pgTable(
  'character',
  {
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
    accessLevel: accessLevelEnum('access_level').notNull().default('private'),
    schoolId: text('school_id').references(() => schoolTable.id),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    attachedLinks: text('attached_links')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    isDeleted: boolean('is_deleted').notNull().default(false),
    originalCharacterId: uuid('original_character_id'),
  },
  (table) => [index().on(table.userId), index().on(table.schoolId)],
);

export const characterSelectSchema = createSelectSchema(characterTable);
export const characterInsertSchema = createInsertSchema(characterTable)
  .omit({
    id: true,
    createdAt: true,
  })
  // for any reason accessLevel has a different type so we have to override it here
  .extend({
    accessLevel: accessLevelSchema,
  });
export const characterUpdateSchema = createUpdateSchema(characterTable)
  .omit({
    userId: true,
    createdAt: true,
  })
  // for any reason accessLevel has a different type so we have to override it here
  .extend({
    id: z.string(),
    accessLevel: accessLevelSchema,
  });

export type CharacterSelectModel = z.infer<typeof characterSelectSchema>;
export type CharacterInsertModel = z.infer<typeof characterInsertSchema>;
export type CharacterUpdateModel = z.infer<typeof characterUpdateSchema>;

// Type for character with sharing data (from JOIN with sharedCharacterConversation)
export type CharacterWithShareDataModel = CharacterSelectModel & {
  telliPointsLimit: number | null;
  inviteCode: string | null;
  maxUsageTimeLimit: number | null;
  startedAt: Date | null;
  startedBy: string | null;
};

/**
 * Schema for table character_template_mappings
 */
export const characterTemplateMappingTable = pgTable(
  'character_template_mappings',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => characterTable.id, { onDelete: 'cascade' }),
    federalStateId: text('federal_state_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.characterId, table.federalStateId] }),
    foreignKey({
      columns: [table.federalStateId],
      foreignColumns: [federalStateTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'character_template_mappings_federal_state_id_fk',
    }).onDelete('cascade'),
  ],
);

export const characterTemplateMappingSelectSchema = createSelectSchema(
  characterTemplateMappingTable,
);
export const characterTemplateMappingInsertSchema = createInsertSchema(
  characterTemplateMappingTable,
);
// no update schema as there are only two fields which are both part of the primary key

export type CharacterTemplateMappingSelectModel = z.infer<
  typeof characterTemplateMappingSelectSchema
>;
export type CharacterTemplateMappingInsertModel = z.infer<
  typeof characterTemplateMappingInsertSchema
>;

/**
 * Schema for table llm_model
 */
export const llmModelTypeSchema = z.enum(['text', 'image', 'fc']);
export const llmModelTypeEnum = pgEnum('llm_model_type', llmModelTypeSchema.enum);
export type LlmModeType = z.infer<typeof llmModelTypeSchema>;

export const llmModelTable = pgTable(
  'llm_model',
  {
    id: uuid('id').primaryKey(),
    provider: text('owner').notNull(),
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description').notNull().default(''),
    priceMetadata: json('price_metadata').$type<LlmModelPriceMetadata>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    supportedImageFormats: json('supported_image_formats').$type<string[]>(),
    isNew: boolean('is_new').notNull().default(false),
    isDeleted: boolean('is_deleted').notNull().default(false),
  },
  (table) => [unique().on(table.provider, table.name)],
);

export const llmModelSelectSchema = createSelectSchema(llmModelTable);
export const llmModelInsertSchema = createInsertSchema(llmModelTable).omit({
  id: true,
  createdAt: true,
});
export const llmModelUpdateSchema = createUpdateSchema(llmModelTable)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type LlmModelSelectModel = z.infer<typeof llmModelSelectSchema>;
export type LlmModelInsertModel = z.infer<typeof llmModelInsertSchema>;
export type LlmModelUpdateModel = z.infer<typeof llmModelUpdateSchema>;

/**
 * Schema for table federal_state_llm_model_mapping
 */
export const federalStateLlmModelMappingTable = pgTable(
  'federal_state_llm_model_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    federalStateId: text('federal_state_id').notNull(),
    llmModelId: uuid('llm_model_id')
      .references(() => llmModelTable.id)
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.federalStateId],
      foreignColumns: [federalStateTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'federal_state_llm_model_mapping_federal_state_id_fk',
    }),
    unique('federal_state_llm_model_mapping_federal_state_llm_model_unique').on(
      table.federalStateId,
      table.llmModelId,
    ),
  ],
);

export const federalStateLlmModelMappingSelectSchema = createSelectSchema(
  federalStateLlmModelMappingTable,
).extend({
  createdAt: z.coerce.date(),
});
export const federalStateLlmModelMappingInsertSchema = createInsertSchema(
  federalStateLlmModelMappingTable,
).omit({ id: true, createdAt: true });
export const federalStateLlmModelMappingUpdateSchema = createUpdateSchema(
  federalStateLlmModelMappingTable,
)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type FederalStateLlmModelMappingSelectModel = z.infer<
  typeof federalStateLlmModelMappingSelectSchema
>;
export type FederalStateLlmModelMappingInsertModel = z.infer<
  typeof federalStateLlmModelMappingInsertSchema
>;
export type FederalStateLlmModelMappingUpdateModel = z.infer<
  typeof federalStateLlmModelMappingUpdateSchema
>;

/**
 * Schema for table learning_scenario
 */
export const learningScenarioTable = pgTable(
  'learning_scenario',
  {
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
    studentExercise: text('student_exercise').default('').notNull(),
    additionalInstructions: text('additional_instructions'),
    restrictions: text('restrictions'), // Not used anymore
    attachedLinks: text('attached_links')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    pictureId: text('picture_id'),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    isDeleted: boolean('is_deleted').notNull().default(false),
    accessLevel: accessLevelEnum('access_level').notNull().default('private'),
    schoolId: text('school_id').references(() => schoolTable.id),
    originalLearningScenarioId: uuid('original_learning_scenario_id'),
  },
  (table) => [index().on(table.userId)],
);

export const learningScenarioSelectSchema = createSelectSchema(learningScenarioTable);
export const learningScenarioInsertSchema = createInsertSchema(learningScenarioTable)
  .omit({
    id: true,
    createdAt: true,
    userId: true,
  })
  // for any reason accessLevel has a different type so we have to override it here
  .extend({
    accessLevel: accessLevelSchema,
  });
export const learningScenarioUpdateSchema = createUpdateSchema(learningScenarioTable)
  .omit({ userId: true, createdAt: true })
  // for any reason accessLevel has a different type so we have to override it here
  .extend({
    id: z.string(),
    accessLevel: accessLevelSchema,
  });

export type LearningScenarioSelectModel = z.infer<typeof learningScenarioSelectSchema>;
export type LearningScenarioInsertModel = z.infer<typeof learningScenarioInsertSchema>;
export type LearningScenarioUpdateModel = z.infer<typeof learningScenarioUpdateSchema>;

/**
 * Schema for table shared_learning_scenario
 */
export const sharedLearningScenarioTable = pgTable(
  'shared_learning_scenario',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    learningScenarioId: uuid('learning_scenario_id')
      .references(() => learningScenarioTable.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => userTable.id)
      .notNull(),
    telliPointsLimit: integer('telli_points_limit'),
    maxUsageTimeLimit: integer('max_usage_time_limit'),
    inviteCode: text('invite_code').unique(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.learningScenarioId, table.userId)],
);

export const sharedLearningScenarioSelectSchema = createSelectSchema(
  sharedLearningScenarioTable,
).extend({
  startedAt: z.coerce.date().nullable(),
});
export const sharedLearningScenarioInsertSchema = createInsertSchema(
  sharedLearningScenarioTable,
).omit({
  id: true,
  inviteCode: true,
  startedAt: true,
});
export const sharedLearningScenarioUpdateSchema = createUpdateSchema(sharedLearningScenarioTable)
  .omit({ learningScenarioId: true, userId: true, startedAt: true })
  .extend({
    id: z.string(),
  });

export type SharedLearningScenarioSelectModel = z.infer<typeof sharedLearningScenarioSelectSchema>;
export type SharedLearningScenarioInsertModel = z.infer<typeof sharedLearningScenarioInsertSchema>;
export type SharedLearningScenarioUpdateModel = z.infer<typeof sharedLearningScenarioUpdateSchema>;

// Type for learning scenario with sharing data (from JOIN with sharedLearningScenario)
const sharedLearningScenarioTransformedSchema = sharedLearningScenarioSelectSchema
  .omit({ id: true, learningScenarioId: true, userId: true })
  .extend({ startedBy: z.string() });
export const learningScenarioWithShareDataModel = learningScenarioSelectSchema.and(
  sharedLearningScenarioTransformedSchema,
);
export const learningScenarioOptionalShareDataModel = learningScenarioSelectSchema.and(
  sharedLearningScenarioTransformedSchema.extend({
    startedBy: z.string().nullable(),
  }),
);
export type LearningScenarioWithShareDataModel = z.infer<typeof learningScenarioWithShareDataModel>;
export type LearningScenarioOptionalShareDataModel = z.infer<
  typeof learningScenarioOptionalShareDataModel
>;

/**
 * Schema for table shared_learning_scenario_usage_tracking
 */
export const sharedLearningScenarioUsageTracking = pgTable(
  'shared_learning_scenario_usage_tracking',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    modelId: uuid('model_id').notNull(),
    learningScenarioId: uuid('learning_scenario_id').notNull(),
    userId: uuid('user_id').notNull(),
    completionTokens: integer('completion_tokens').notNull(),
    promptTokens: integer('prompt_tokens').notNull(),
    costsInCent: doublePrecision('costs_in_cent').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.modelId],
      foreignColumns: [llmModelTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'shared_learning_scenario_usage_tracking_model_id_fk',
    }),
    index('shared_learning_scenario_usage_tracking_conversation_id_index').on(
      table.learningScenarioId,
    ),
    index().on(table.userId),
    index().on(table.createdAt),
  ],
);

export const sharedLearningScenarioUsageTrackingSelectSchema = createSelectSchema(
  sharedLearningScenarioUsageTracking,
).extend({
  createdAt: z.coerce.date(),
});
export const sharedLearningScenarioUsageTrackingInsertSchema = createInsertSchema(
  sharedLearningScenarioUsageTracking,
).omit({ id: true, createdAt: true });
export const sharedLearningScenarioUsageTrackingUpdateSchema = createUpdateSchema(
  sharedLearningScenarioUsageTracking,
)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type SharedLearningScenarioUsageTrackingSelectModel = z.infer<
  typeof sharedLearningScenarioUsageTrackingSelectSchema
>;
export type SharedLearningScenarioUsageTrackingInsertModel = z.infer<
  typeof sharedLearningScenarioUsageTrackingInsertSchema
>;
export type SharedLearningScenarioUsageTrackingUpdateModel = z.infer<
  typeof sharedLearningScenarioUsageTrackingUpdateSchema
>;

/**
 * Schema for table conversation_usage_tracking
 */
export const conversationUsageTracking = pgTable(
  'conversation_usage_tracking',
  {
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
    costsInCent: doublePrecision('costs_in_cent').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index().on(table.conversationId),
    index().on(table.userId),
    index().on(table.createdAt),
  ],
);

export const conversationUsageTrackingSelectSchema = createSelectSchema(
  conversationUsageTracking,
).extend({
  createdAt: z.coerce.date(),
});
export const conversationUsageTrackingInsertSchema = createInsertSchema(
  conversationUsageTracking,
).omit({ id: true, createdAt: true });
export const conversationUsageTrackingUpdateSchema = createUpdateSchema(conversationUsageTracking)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type ConversationUsageTrackingSelectModel = z.infer<
  typeof conversationUsageTrackingSelectSchema
>;
export type ConversationUsageTrackingInsertModel = z.infer<
  typeof conversationUsageTrackingInsertSchema
>;
export type ConversationUsageTrackingUpdateModel = z.infer<
  typeof conversationUsageTrackingUpdateSchema
>;

/**
 * Schema for table shared_character_conversation
 */
export const sharedCharacterConversation = pgTable(
  'shared_character_conversation',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    characterId: uuid('character_id').notNull(),
    userId: uuid('user_id')
      .references(() => userTable.id)
      .notNull(),
    telliPointsLimit: integer('telli_points_limit'),
    maxUsageTimeLimit: integer('max_usage_time_limit'),
    inviteCode: text('invite_code').unique(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.characterId, table.userId)],
);

export const sharedCharacterConversationSelectSchema = createSelectSchema(
  sharedCharacterConversation,
).extend({
  createdAt: z.coerce.date(),
  startedAt: z.coerce.date().nullable(),
});
export const sharedCharacterConversationInsertSchema = createInsertSchema(
  sharedCharacterConversation,
).omit({ id: true, createdAt: true, inviteCode: true, startedAt: true });
export const sharedCharacterConversationUpdateSchema = createUpdateSchema(
  sharedCharacterConversation,
)
  .omit({ characterId: true, userId: true, createdAt: true })
  .extend({
    id: z.string(),
  });

export type SharedCharacterConversationSelectModel = z.infer<
  typeof sharedCharacterConversationSelectSchema
>;
export type SharedCharacterConversationInsertModel = z.infer<
  typeof sharedCharacterConversationInsertSchema
>;
export type SharedCharacterConversationUpdateModel = z.infer<
  typeof sharedCharacterConversationUpdateSchema
>;

/**
 * Schema for table shared_character_chat_usage_tracking
 */
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
    costsInCent: doublePrecision('costs_in_cent').notNull().default(0),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index().on(table.characterId), index().on(table.userId), index().on(table.createdAt)],
);

export const sharedCharacterChatUsageTrackingSelectSchema = createSelectSchema(
  sharedCharacterChatUsageTrackingTable,
).extend({
  createdAt: z.coerce.date(),
});
export const sharedCharacterChatUsageTrackingInsertSchema = createInsertSchema(
  sharedCharacterChatUsageTrackingTable,
).omit({ id: true, createdAt: true });
export const sharedCharacterChatUsageTrackingUpdateSchema = createUpdateSchema(
  sharedCharacterChatUsageTrackingTable,
)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type SharedCharacterChatUsageTrackingSelectModel = z.infer<
  typeof sharedCharacterChatUsageTrackingSelectSchema
>;
export type SharedCharacterChatUsageTrackingInsertModel = z.infer<
  typeof sharedCharacterChatUsageTrackingInsertSchema
>;
export type SharedCharacterChatUsageTrackingUpdateModel = z.infer<
  typeof sharedCharacterChatUsageTrackingUpdateSchema
>;

/**
 * Schema for table custom_gpt
 */
export const customGptTable = pgTable(
  'custom_gpt',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    systemPrompt: text('system_prompt').notNull(),
    userId: uuid('user_id').references(() => userTable.id),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    schoolId: text('school_id').references(() => schoolTable.id),
    accessLevel: accessLevelEnum('access_level').notNull().default('private'),
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
    isDeleted: boolean('is_deleted').notNull().default(false),
    originalCustomGptId: uuid('original_custom_gpt_id'),
  },
  (table) => [index().on(table.userId), index().on(table.schoolId)],
);

export const customGptSelectSchema = createSelectSchema(customGptTable).extend({
  createdAt: z.coerce.date(),
  accessLevel: accessLevelSchema,
});
export const customGptInsertSchema = createInsertSchema(customGptTable)
  .omit({ id: true, createdAt: true })
  .extend({
    accessLevel: accessLevelSchema,
  });
export const customGptUpdateSchema = createUpdateSchema(customGptTable)
  .omit({
    userId: true,
    schoolId: true,
    createdAt: true,
  })
  .extend({
    id: z.string(),
    // for any reason accessLevel has a different type so we have to override it here
    accessLevel: accessLevelSchema.optional(),
  });

export type CustomGptSelectModel = z.infer<typeof customGptSelectSchema>;
export type CustomGptInsertModel = z.infer<typeof customGptInsertSchema>;
export type CustomGptUpdateModel = z.infer<typeof customGptUpdateSchema>;

/**
 * Schema for table custom_gpt_template_mappings
 */
export const customGptTemplateMappingTable = pgTable(
  'custom_gpt_template_mappings',
  {
    customGptId: uuid('custom_gpt_id')
      .notNull()
      .references(() => customGptTable.id, { onDelete: 'cascade' }),
    federalStateId: text('federal_state_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.customGptId, table.federalStateId] }),
    foreignKey({
      columns: [table.federalStateId],
      foreignColumns: [federalStateTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'character_template_mappings_federal_state_id_fk',
    }).onDelete('cascade'),
  ],
);

export const customGptTemplateMappingSelectSchema = createSelectSchema(
  customGptTemplateMappingTable,
);
export const customGptTemplateMappingInsertSchema = createInsertSchema(
  customGptTemplateMappingTable,
);
// no update schema as there are only two fields which are both part of the primary key

export type CustomGptTemplateMappingSelectModel = z.infer<
  typeof customGptTemplateMappingSelectSchema
>;
export type CustomGptTemplateMappingInsertModel = z.infer<
  typeof customGptTemplateMappingInsertSchema
>;

/**
 * Schema for table file_table
 */
export const fileTable = pgTable('file_table', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  type: text('type').notNull(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  metadata: json('metadata').$type<FileMetadata>(),
});

export const fileSelectSchema = createSelectSchema(fileTable).extend({
  createdAt: z.coerce.date(),
});
export const fileInsertSchema = createInsertSchema(fileTable).omit({ createdAt: true });
export const fileUpdateSchema = createUpdateSchema(fileTable).omit({ createdAt: true }).extend({
  id: z.string(),
});

export type FileSelectModel = z.infer<typeof fileSelectSchema>;
export type FileInsertModel = z.infer<typeof fileInsertSchema>;
export type FileUpdateModel = z.infer<typeof fileUpdateSchema>;

// Keep existing extended types
export type FileModel = typeof fileTable.$inferSelect;
export type FileModelAndUrl = FileModel & { signedUrl: string };
export type FileModelAndContent = FileModel & { content?: string };

/**
 * Schema for table conversation_message_file_mapping
 */
export const ConversationMessageFileMappingTable = pgTable(
  'conversation_message_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('fileId')
      .references(() => fileTable.id)
      .notNull(),
    conversationMessageId: uuid('conversationMessageId').notNull(),
    // technically redundant but there files and conversations should be unique and it makes clean-up easier
    conversationId: uuid('conversationId').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index().on(table.conversationMessageId),
    unique().on(table.conversationId, table.fileId),
    foreignKey({
      columns: [table.conversationMessageId],
      foreignColumns: [conversationMessageTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'conversation_message_file_mapping_conversationMessageId_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.conversationId],
      foreignColumns: [conversationTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'conversation_message_file_mapping_conversationId_fk',
    }).onDelete('cascade'),
  ],
);

export const conversationMessageFileMappingSelectSchema = createSelectSchema(
  ConversationMessageFileMappingTable,
).extend({
  createdAt: z.coerce.date(),
});
export const conversationMessageFileMappingInsertSchema = createInsertSchema(
  ConversationMessageFileMappingTable,
).omit({ id: true, createdAt: true });
export const conversationMessageFileMappingUpdateSchema = createUpdateSchema(
  ConversationMessageFileMappingTable,
)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type ConversationMessageFileMappingSelectModel = z.infer<
  typeof conversationMessageFileMappingSelectSchema
>;
export type ConversationMessageFileMappingInsertModel = z.infer<
  typeof conversationMessageFileMappingInsertSchema
>;
export type ConversationMessageFileMappingUpdateModel = z.infer<
  typeof conversationMessageFileMappingUpdateSchema
>;

/**
 * Schema for table learning_scenario_file_mapping
 */
export const LearningScenarioFileMapping = pgTable(
  'learning_scenario_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id)
      .notNull(),
    learningScenarioId: uuid('learning_scenario_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique('learning_scenario_file_mapping_learningScenarioId_fileId_unique').on(
      table.learningScenarioId,
      table.fileId,
    ),
    foreignKey({
      columns: [table.learningScenarioId],
      foreignColumns: [learningScenarioTable.id],
      // Set a custom name because the auto-generated name is too long and will be silently truncated to 63 characters
      // The custom name can only be set with foreignKey() function
      name: 'learning_scenario_file_mapping_learning_scenario_id_fk',
    }).onDelete('cascade'),
  ],
);

export const learningScenarioFileMappingSelectSchema = createSelectSchema(
  LearningScenarioFileMapping,
).extend({
  createdAt: z.coerce.date(),
});
export const learningScenarioFileMappingInsertSchema = createInsertSchema(
  LearningScenarioFileMapping,
).omit({ id: true, createdAt: true });
export const learningScenarioFileMappingUpdateSchema = createUpdateSchema(
  LearningScenarioFileMapping,
)
  .omit({ createdAt: true })
  .extend({
    id: z.string(),
  });

export type LearningScenarioFileMappingSelectModel = z.infer<
  typeof learningScenarioFileMappingSelectSchema
>;
export type LearningScenarioFileMappingInsertModel = z.infer<
  typeof learningScenarioFileMappingInsertSchema
>;
export type LearningScenarioFileMappingUpdateModel = z.infer<
  typeof learningScenarioFileMappingUpdateSchema
>;

/**
 * Schema for table character_file_mapping
 */
export const CharacterFileMapping = pgTable(
  'character_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id)
      .notNull(),
    characterId: uuid('character_id')
      .references(() => characterTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.characterId, table.fileId)],
);

export const characterFileMappingSelectSchema = createSelectSchema(CharacterFileMapping).extend({
  createdAt: z.coerce.date(),
});
export const characterFileMappingInsertSchema = createInsertSchema(CharacterFileMapping).omit({
  id: true,
  createdAt: true,
});
export const characterFileMappingUpdateSchema = createUpdateSchema(CharacterFileMapping)
  .omit({
    createdAt: true,
  })
  .extend({
    id: z.string(),
  });

export type CharacterFileMappingSelectModel = z.infer<typeof characterFileMappingSelectSchema>;
export type CharacterFileMappingInsertModel = z.infer<typeof characterFileMappingInsertSchema>;
export type CharacterFileMappingUpdateModel = z.infer<typeof characterFileMappingUpdateSchema>;

/**
 * Schema for table custom_gpt_file_mapping
 */
export const CustomGptFileMapping = pgTable(
  'custom_gpt_file_mapping',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id)
      .notNull(),
    customGptId: uuid('custom_gpt_id')
      .references(() => customGptTable.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.customGptId, table.fileId)],
);

export const customGptFileMappingSelectSchema = createSelectSchema(CustomGptFileMapping).extend({
  createdAt: z.coerce.date(),
});
export const customGptFileMappingInsertSchema = createInsertSchema(CustomGptFileMapping).omit({
  id: true,
  createdAt: true,
});
export const customGptFileMappingUpdateSchema = createUpdateSchema(CustomGptFileMapping)
  .omit({
    createdAt: true,
  })
  .extend({
    id: z.string(),
  });

export type CustomGptFileMappingSelectModel = z.infer<typeof customGptFileMappingSelectSchema>;
export type CustomGptFileMappingInsertModel = z.infer<typeof customGptFileMappingInsertSchema>;
export type CustomGptFileMappingUpdateModel = z.infer<typeof customGptFileMappingUpdateSchema>;

/**
 * Schema for table text_chunk
 */
export const TextChunkTable = pgTable(
  'text_chunk',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    fileId: text('file_id')
      .references(() => fileTable.id, { onDelete: 'cascade' })
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
  (table) => [
    index().on(table.fileId),
    index('text_chunk_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
    index('text_chunk_content_tsv_idx').using('gin', table.contentTsv),
  ],
);

export const textChunkSelectSchema = createSelectSchema(TextChunkTable);
export const textChunkInsertSchema = createInsertSchema(TextChunkTable).omit({ id: true });
export const textChunkUpdateSchema = createUpdateSchema(TextChunkTable).extend({
  id: z.string(),
});

export type TextChunkSelectModel = z.infer<typeof textChunkSelectSchema>;
export type TextChunkInsertModel = z.infer<typeof textChunkInsertSchema>;
export type TextChunkUpdateModel = z.infer<typeof textChunkUpdateSchema>;

/**
 * Schema for table voucher
 */
export const voucherStatus = z.enum(['created', 'redeemed', 'revoked']);
export const voucherStatusEnum = pgEnum('voucher_status', voucherStatus.enum);

export const VoucherTable = pgTable(
  'voucher',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    increaseAmount: integer('increase_amount').notNull(),
    durationMonths: integer('duration_months').notNull(),
    status: voucherStatusEnum('status').notNull().default('created'),
    validUntil: timestamp('valid_until', { mode: 'date', withTimezone: true }).notNull(),
    federalStateId: text('federal_state_id')
      .references(() => federalStateTable.id)
      .notNull(),
    redeemedBy: uuid('redeemed_by').references(() => userTable.id),
    redeemedAt: timestamp('redeemed_at', { mode: 'date', withTimezone: true }),
    createdBy: text('created_by').notNull(),
    createdAt: timestamp('created_at', { mode: 'date', withTimezone: true }).defaultNow().notNull(),
    createReason: text('create_reason').notNull().default(''),
    updatedBy: text('updated_by'),
    updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true }),
    updateReason: text('update_reason').notNull().default(''),
  },
  (table) => [index().on(table.federalStateId), index().on(table.redeemedBy)],
);

export const voucherSelectSchema = createSelectSchema(VoucherTable).extend({
  createdAt: z.coerce.date(),
  validUntil: z.coerce.date(),
  redeemedAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
});
export const voucherInsertSchema = createInsertSchema(VoucherTable)
  .extend({ status: voucherStatus })
  .omit({
    id: true,
    createdAt: true,
    redeemedAt: true,
    updatedAt: true,
  });
export const voucherUpdateSchema = createUpdateSchema(VoucherTable)
  .omit({
    createdAt: true,
  })
  .extend({
    id: z.string(),
    status: voucherStatus,
  });

export type VoucherSelectModel = z.infer<typeof voucherSelectSchema>;
export type VoucherInsertModel = z.infer<typeof voucherInsertSchema>;
export type VoucherUpdateModel = z.infer<typeof voucherUpdateSchema>;
