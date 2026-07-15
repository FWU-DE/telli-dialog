import {
  verifyFilesDoNotBelongToAnyUser,
  verifySharedChatEntityIsAccessible,
  verifySharedChatFileOwnershipBySession,
  verifySharedChatIsNotDeleted,
  verifySharedChatIsNotExpired,
  verifySharedChatIsNotSuspended,
} from './shared-chat-verify';

// rexport types from ./shared-chat-types.ts
export type {
  SharedSessionId,
  SharedChatCharacter,
  SharedChatLearningScenario,
  SharedChatEntity,
  SharedChatFileMetadata,
} from './shared-chat-types';

export const verify = {
  sharedChatFileOwnershipBySession: verifySharedChatFileOwnershipBySession,
  filesDoNotBelongToAnyUser: verifyFilesDoNotBelongToAnyUser,
  sharedChatIsNotExpired: verifySharedChatIsNotExpired,
  sharedChatIsNotDeleted: verifySharedChatIsNotDeleted,
  sharedChatIsNotSuspended: verifySharedChatIsNotSuspended,
  sharedChatEntityIsAccessible: verifySharedChatEntityIsAccessible,
};
