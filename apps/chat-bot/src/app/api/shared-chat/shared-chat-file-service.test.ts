import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  dbGetFilesInIdsMock: vi.fn(),
}));

vi.mock('@shared/db/functions/files', () => ({
  dbGetFilesInIds: mocks.dbGetFilesInIdsMock,
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
    inviteCode: 'invite-1',
    entityType: 'character',
    entityId: 'character-1',
    sessionId: 'session-1',
  },
  userId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('combineSharedRelatedFiles', () => {
  it('returns related files unchanged when no fileIds are provided', async () => {
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      fileIds: undefined,
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(result).toEqual([relatedFile]);
    expect(mocks.dbGetFilesInIdsMock).not.toHaveBeenCalled();
  });

  it('throws when sharedSessionId is missing for uploaded files', async () => {
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    await expect(
      combineSharedRelatedFiles({
        relatedFileEntities: [relatedFile],
        fileIds: ['uploaded-file'],
        inviteCode: 'invite-1',
        entityType: 'character',
        entityId: 'character-1',
      }),
    ).rejects.toThrow('Not authorized to use uploaded files');

    expect(mocks.dbGetFilesInIdsMock).not.toHaveBeenCalled();
  });

  it('associates uploaded files with the latest user message id', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([uploadedFile]);
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      fileIds: ['uploaded-file'],
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(mocks.dbGetFilesInIdsMock).toHaveBeenCalledWith(['uploaded-file']);
    expect(result).toEqual([relatedFile, uploadedFile]);
  });

  it('returns related files combined with uploaded files when fileIds are provided', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([uploadedFile]);
    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    const result = await combineSharedRelatedFiles({
      relatedFileEntities: [relatedFile],
      fileIds: ['uploaded-file'],
      inviteCode: 'invite-1',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(result).toEqual([relatedFile, uploadedFile]);
  });

  it('throws when uploaded file belongs to another shared session', async () => {
    mocks.dbGetFilesInIdsMock.mockResolvedValue([
      {
        ...uploadedFile,
        metadata: {
          ...uploadedFile.metadata,
          sessionId: 'session-other',
        },
      },
    ]);

    const { combineSharedRelatedFiles } = await import('./shared-chat-file-service');

    await expect(
      combineSharedRelatedFiles({
        relatedFileEntities: [relatedFile],
        fileIds: ['uploaded-file'],
        inviteCode: 'invite-1',
        entityType: 'character',
        entityId: 'character-1',
        sharedSessionId: 'session-1',
      }),
    ).rejects.toThrow('Not authorized to access this file');
  });
});
