import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '@/types/chat';

const mocks = vi.hoisted(() => ({
  dbGetFilesInIdsMock: vi.fn(),
}));

vi.mock('@shared/db/functions/files', () => ({
  dbGetFilesInIds: mocks.dbGetFilesInIdsMock,
}));

vi.mock('./shared-chat-upload-service', () => ({
  resolveSharedUploadContext: vi.fn().mockResolvedValue({
    inviteCode: 'invite-1',
    entityType: 'character',
    entityId: 'character-1',
    startedBy: 'teacher-1',
    federalStateId: 'federal-state-1',
  }),
  assertSharedChatFileOwnershipBySession: vi.fn(
    ({
      metadata,
      sharedSessionId,
    }: {
      metadata: { sharedChatSessionId?: string };
      sharedSessionId: string;
    }) => {
      if (metadata.sharedChatSessionId !== sharedSessionId) {
        throw new Error('Not authorized to access this file');
      }
    },
  ),
}));

const relatedFile = {
  id: 'related-file',
  name: 'context.pdf',
  type: 'pdf',
  size: 10,
  createdAt: new Date('2026-01-01'),
  metadata: null,
  userId: null,
};

const uploadedFile = {
  id: 'uploaded-file',
  name: 'photo.png',
  type: 'png',
  size: 11,
  createdAt: new Date('2026-01-02'),
  metadata: {
    sharedChatInviteCode: 'invite-1',
    sharedChatEntityType: 'character',
    sharedChatEntityId: 'character-1',
    sharedChatSessionId: 'session-1',
  },
  userId: null,
};

const messages: ChatMessage[] = [
  { id: 'assistant-1', role: 'assistant', content: 'Hi' },
  { id: 'user-1', role: 'user', content: 'Hello' },
  { id: 'assistant-2', role: 'assistant', content: 'How can I help?' },
  { id: 'user-2', role: 'user', content: 'Use this image' },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('combineSharedRelatedFiles', () => {
  it('returns related files unchanged when no fileIds are provided', async () => {
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      messages,
      fileIds: undefined,
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(result).toEqual([relatedFile]);
    expect(mocks.dbGetFilesInIdsMock).not.toHaveBeenCalled();
  });

  it('associates uploaded files with the latest user message id', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([uploadedFile]);
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      messages,
      fileIds: ['uploaded-file'],
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(mocks.dbGetFilesInIdsMock).toHaveBeenCalledWith(['uploaded-file']);
    expect(result).toEqual([
      relatedFile,
      {
        ...uploadedFile,
        conversationMessageId: 'user-2',
      },
    ]);
  });

  it('returns related files when fileIds are provided but no user message exists', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([uploadedFile]);
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      messages: [{ id: 'assistant-1', role: 'assistant', content: 'Only assistant' }],
      fileIds: ['uploaded-file'],
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(result).toEqual([relatedFile]);
  });

  it('deduplicates by file id and prefers uploaded mapping with message id', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([{ ...uploadedFile, id: relatedFile.id }]);
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      messages,
      fileIds: ['related-file'],
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(result).toEqual([
      {
        ...uploadedFile,
        id: relatedFile.id,
        conversationMessageId: 'user-2',
      },
    ]);
  });

  it('throws when uploaded file belongs to another shared session', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([
      {
        ...uploadedFile,
        metadata: {
          ...uploadedFile.metadata,
          sharedChatSessionId: 'session-other',
        },
      },
    ]);

    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    await expect(
      combineSharedRelatedFiles({
        relatedFileEntities: [relatedFile],
        messages,
        fileIds: ['uploaded-file'],
        inviteCode: 'invite-1',
        entityType: 'character',
        entityId: 'character-1',
        sharedSessionId: 'session-1',
      }),
    ).rejects.toThrow('Not authorized to access this file');
  });
});
