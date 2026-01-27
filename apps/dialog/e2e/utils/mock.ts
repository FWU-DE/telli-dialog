import { UserAndContext } from '@/auth/types';
import { generateRandomString } from './random';
import { generateUUID } from '@shared/utils/uuid';
import {
  CharacterSelectModel,
  ConversationUsageTrackingSelectModel,
  LlmModelSelectModel,
  SharedCharacterChatUsageTrackingSelectModel,
  SharedSchoolConversationSelectModel,
  SharedSchoolConversationUsageTrackingSelectModel,
} from '@shared/db/schema';

export const mockUserAndContext = (): UserAndContext => {
  return {
    id: generateUUID(),
    firstName: generateRandomString(10),
    lastName: generateRandomString(10),
    email: `mock.user@${generateRandomString(5)}.com`,
    lastUsedModel: null,
    versionAcceptedConditions: null,
    hasApiKeyAssigned: true,
    school: {
      id: generateUUID(),
      userRole: 'teacher',
      federalStateId: generateUUID(),
      createdAt: new Date(),
    },
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
      },
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

export const mockSharedSchoolConversation = (): SharedSchoolConversationSelectModel => {
  return {
    id: generateUUID(),
    name: generateRandomString(10),
    createdAt: new Date(),
    description: generateRandomString(10),
    modelId: generateUUID(),
    userId: generateUUID(),
    studentExcercise: generateRandomString(10),
    telliPointsLimit: 10,
    maxUsageTimeLimit: 45,
    attachedLinks: [],
    startedAt: new Date(),
    schoolType: null,
    gradeLevel: null,
    subject: null,
    additionalInstructions: null,
    restrictions: null,
    pictureId: null,
    inviteCode: null,
  };
};

export const mockSharedSchoolConversationUsage =
  (): SharedSchoolConversationUsageTrackingSelectModel => {
    return {
      id: generateUUID(),
      userId: generateUUID(),
      modelId: generateUUID(),
      sharedSchoolConversationId: generateUUID(),
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
    attachedLinks: [],
    originalCharacterId: null,
    isDeleted: false,
  };
};
