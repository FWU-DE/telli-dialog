import { UserAndContext } from '@/auth/types';
import { generateRandomString } from './random';
import { generateUUID } from '@shared/utils/uuid';
import {
  CharacterSelectModel,
  ConversationUsageTrackingSelectModel,
  LearningScenarioSelectModel,
  LlmModelSelectModel,
  SharedCharacterChatUsageTrackingSelectModel,
  SharedLearningScenarioUsageTrackingSelectModel,
} from '@shared/db/schema';
import { E2E_FEDERAL_STATE } from './const';

export const mockUserAndContext = (): UserAndContext => {
  const schoolId = generateUUID();

  return {
    id: generateUUID(),
    lastUsedModel: null,
    versionAcceptedConditions: null,
    schoolIds: [schoolId],
    federalStateId: E2E_FEDERAL_STATE,
    userRole: 'teacher',
    hasApiKeyAssigned: true,
    federalState: {
      id: generateUUID(),
      teacherPriceLimit: 500,
      createdAt: new Date(),
      studentPriceLimit: 0,
      mandatoryCertificationTeacher: null,
      chatStorageTime: 0,
      supportContacts: null,
      trainingLink: null,
      designConfiguration: null,
      telliName: null,
      featureToggles: {
        isStudentAccessEnabled: false,
        isCharacterEnabled: false,
        isCustomGptEnabled: false,
        isSharedChatEnabled: false,
        isShareTemplateWithSchoolEnabled: false,
        isNewUiDesignEnabled: false,
      },
      pictureUrls: null,
    },
    createdAt: new Date(),
  };
};

export const mockLlmModel = (): LlmModelSelectModel => {
  return {
    id: generateUUID(),
    name: generateRandomString(10),
    createdAt: new Date(),
    provider: generateRandomString(10),
    displayName: generateRandomString(10),
    description: generateRandomString(10),
    priceMetadata: {
      type: 'text',
      completionTokenPrice: 0,
      promptTokenPrice: 0,
    },
    supportedImageFormats: null,
    isNew: false,
    isDeleted: false,
  };
};

export const mockConversationUsage = (): ConversationUsageTrackingSelectModel => {
  return {
    id: generateUUID(),
    userId: generateUUID(),
    modelId: generateUUID(),
    conversationId: generateUUID(),
    completionTokens: 0,
    promptTokens: 0,
    costsInCent: 0,
    createdAt: new Date(),
  };
};

export const mockLearningScenario = (): LearningScenarioSelectModel => {
  return {
    id: generateUUID(),
    name: generateRandomString(10),
    createdAt: new Date(),
    updatedAt: new Date(),
    description: generateRandomString(10),
    modelId: generateUUID(),
    userId: generateUUID(),
    studentExercise: generateRandomString(10),
    attachedLinks: [],
    schoolType: null,
    gradeLevel: null,
    subject: null,
    additionalInstructions: null,
    restrictions: null,
    pictureId: null,
    accessLevel: 'private',
    schoolId: null,
    originalLearningScenarioId: null,
    isDeleted: false,
    hasLinkAccess: false,
  };
};

export const mockSharedSchoolConversationUsage =
  (): SharedLearningScenarioUsageTrackingSelectModel => {
    return {
      id: generateUUID(),
      userId: generateUUID(),
      modelId: generateUUID(),
      learningScenarioId: generateUUID(),
      completionTokens: 0,
      promptTokens: 0,
      costsInCent: 0,
      createdAt: new Date(),
    };
  };

export const mockSharedCharacterChatUsage = (): SharedCharacterChatUsageTrackingSelectModel => {
  return {
    id: generateUUID(),
    userId: generateUUID(),
    modelId: generateUUID(),
    characterId: generateUUID(),
    completionTokens: 0,
    promptTokens: 0,
    costsInCent: 0,
    createdAt: new Date(),
  };
};

export const mockCharacter = (): CharacterSelectModel => {
  return {
    id: generateUUID(),
    userId: generateUUID(),
    modelId: generateUUID(),
    name: generateRandomString(10),
    description: generateRandomString(10),
    instructions: generateRandomString(10),
    learningContext: generateRandomString(10),
    competence: generateRandomString(10),
    schoolType: generateRandomString(10),
    gradeLevel: generateRandomString(10),
    subject: generateRandomString(10),
    specifications: generateRandomString(10),
    restrictions: generateRandomString(10),
    pictureId: generateUUID(),
    initialMessage: generateRandomString(10),
    accessLevel: 'private',
    schoolId: generateUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    attachedLinks: [],
    originalCharacterId: null,
    isDeleted: false,
    hasLinkAccess: false,
  };
};
