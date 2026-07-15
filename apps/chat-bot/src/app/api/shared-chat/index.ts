import {
  verifyFilesDoNotBelongToAnyUser,
  verifySharedChatEntityIsAccessible,
  verifySharedChatFileOwnershipBySession,
  verifySharedChatIsNotDeleted,
  verifySharedChatIsNotExpired,
  verifySharedChatIsNotSuspended,
} from './shared-chat-verify';

// reexport types from ./shared-chat-types.ts
export type {
  SharedSessionId,
  SharedChatCharacter,
  SharedChatLearningScenario,
  SharedChatEntity,
  SharedChatFileMetadata,
} from './shared-chat-types';

// reexport guards from ./shared-chat-types.ts
export { isSharedChatFileMetadata } from './shared-chat-types';

// export verification helper
export const verify = {
  sharedChatFileOwnershipBySession: verifySharedChatFileOwnershipBySession,
  filesDoNotBelongToAnyUser: verifyFilesDoNotBelongToAnyUser,
  sharedChatIsNotExpired: verifySharedChatIsNotExpired,
  sharedChatIsNotDeleted: verifySharedChatIsNotDeleted,
  sharedChatIsNotSuspended: verifySharedChatIsNotSuspended,
  sharedChatEntityIsAccessible: verifySharedChatEntityIsAccessible,
};
