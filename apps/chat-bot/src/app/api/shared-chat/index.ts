import {
  verifyFilesDoNotBelongToAnyUser,
  verifySharedChatCanBeAccessed,
  verifySharedChatFileOwnershipBySession,
  verifySharedChatIsNotDeleted,
  verifySharedChatIsNotExpired,
  verifySharedChatIsNotSuspended,
} from './shared-chat-verify';

// rexport types from ./shared-chat-types.ts
export type {
  SharedSessionId,
  SharedEntityContext,
  SharedChatFileMetadata,
  SharedMessageFileModel,
} from './shared-chat-types';

export const verify = {
  sharedChatFileOwnershipBySession: verifySharedChatFileOwnershipBySession,
  filesDoNotBelongToAnyUser: verifyFilesDoNotBelongToAnyUser,
  sharedChatIsNotExpired: verifySharedChatIsNotExpired,
  sharedChatIsNotDeleted: verifySharedChatIsNotDeleted,
  sharedChatIsNotSuspended: verifySharedChatIsNotSuspended,
  sharedChatCanBeAccessed: verifySharedChatCanBeAccessed,
};
