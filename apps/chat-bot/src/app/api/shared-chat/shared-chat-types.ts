import { FileMetadata, FileModel } from '@shared/db/schema';

export type SharedSessionId = string;

/** Some information about the shared entity that is relevant for the current context */
export type SharedEntityContext = {
  startedBy: string;
  federalStateId: string;
  inviteCode: string;
  entityType: 'character' | 'learningScenario';
  entityId: string;
};

export type SharedChatOwnershipMetadata = {
  sharedChatSessionId: string;
  sharedChatInviteCode: string;
  sharedChatEntityType: 'character' | 'learningScenario';
  sharedChatEntityId: string;
};

/** This object is stored in the metadata column of the files table.
 * It contains the shared chat ownership information as well as any other metadata
 * relevant for that file.
 */
export type SharedChatFileMetadata = SharedChatOwnershipMetadata & FileMetadata;

export type SharedMessageFileModel = FileModel & { conversationMessageId?: string };
