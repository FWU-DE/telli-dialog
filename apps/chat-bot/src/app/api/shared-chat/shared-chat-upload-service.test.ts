import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getUserAndContextByUserIdMock: vi.fn(),
  dbGetCharacterByIdAndInviteCodeMock: vi.fn(),
  dbGetLearningScenarioByIdAndInviteCodeMock: vi.fn(),
  chunkAndEmbedMock: vi.fn(),
  fileExtractionXbergMock: vi.fn(),
  preprocessImageMock: vi.fn(),
  dbInsertFileWithChunksMock: vi.fn(),
  uploadMessageAttachmentMock: vi.fn(),
  cnanoidMock: vi.fn(),
}));

vi.mock('@/auth/utils', () => ({
  getUserAndContextByUserId: mocks.getUserAndContextByUserIdMock,
}));

vi.mock('@shared/db/functions/character', () => ({
  dbGetCharacterByIdAndInviteCode: mocks.dbGetCharacterByIdAndInviteCodeMock,
}));

vi.mock('@shared/db/functions/learning-scenario', () => ({
  dbGetLearningScenarioByIdAndInviteCode: mocks.dbGetLearningScenarioByIdAndInviteCodeMock,
}));

vi.mock('../rag/rag-service', () => ({
  chunkAndEmbed: mocks.chunkAndEmbedMock,
}));

vi.mock('../file-extraction/file-extraction-xberg', () => ({
  fileExtractionXberg: mocks.fileExtractionXbergMock,
}));

vi.mock('../file-operations/preprocess-image', () => ({
  preprocessImage: mocks.preprocessImageMock,
}));

vi.mock('@shared/db/functions/files', () => ({
  dbInsertFileWithChunks: mocks.dbInsertFileWithChunksMock,
}));

vi.mock('@shared/files/fileService', () => ({
  uploadMessageAttachment: mocks.uploadMessageAttachmentMock,
}));

vi.mock('@ais-chat/shared/random/randomService', () => ({
  cnanoid: mocks.cnanoidMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUserAndContextByUserIdMock.mockResolvedValue({
    federalState: {
      id: 'federal-state-1',
    },
  });
  mocks.cnanoidMock.mockReturnValue('abc123');
  mocks.dbInsertFileWithChunksMock.mockResolvedValue(undefined);
  mocks.uploadMessageAttachmentMock.mockResolvedValue(undefined);
  mocks.preprocessImageMock.mockResolvedValue({
    buffer: Buffer.from('processed-image'),
    metadata: { width: 10, height: 10 },
    type: 'png',
  });
  mocks.fileExtractionXbergMock.mockResolvedValue('content');
  mocks.chunkAndEmbedMock.mockResolvedValue([]);
});

describe('resolveSharedUploadContext', () => {
  it('throws when entityId is empty', async () => {
    const { resolveSharedChatEntityContext: resolveSharedUploadContext } =
      await import('./shared-chat-upload-service');

    await expect(
      resolveSharedUploadContext({
        inviteCode: 'invite',
        entityType: 'character',
        entityId: '   ',
      }),
    ).rejects.toThrow('entityId is required.');
  });

  it('resolves context for character uploads', async () => {
    mocks.dbGetCharacterByIdAndInviteCodeMock.mockResolvedValue({
      startedBy: 'teacher-1',
    });

    const { resolveSharedChatEntityContext: resolveSharedUploadContext } =
      await import('./shared-chat-upload-service');

    const result = await resolveSharedUploadContext({
      inviteCode: 'invite',
      entityType: 'character',
      entityId: 'character-1',
    });

    expect(mocks.dbGetCharacterByIdAndInviteCodeMock).toHaveBeenCalledWith({
      id: 'character-1',
      inviteCode: 'invite',
    });
    expect(result).toEqual({
      startedBy: 'teacher-1',
      federalStateId: 'federal-state-1',
      inviteCode: 'invite',
      entityType: 'character',
      entityId: 'character-1',
    });
  });
});

describe('uploadSharedChatFile', () => {
  it('stores shared image uploads with userId=null', async () => {
    mocks.dbGetCharacterByIdAndInviteCodeMock.mockResolvedValue({
      startedBy: 'teacher-1',
    });

    const { uploadSharedChatFile } = await import('./shared-chat-upload-service');

    const file = new File([new Uint8Array([1, 2, 3])], 'upload.png', {
      type: 'image/png',
    });

    const fileId = await uploadSharedChatFile({
      file,
      inviteCode: 'invite',
      entityType: 'character',
      entityId: 'character-1',
      sharedSessionId: 'session-1',
    });

    expect(fileId).toBe('file_abc123');
    expect(mocks.preprocessImageMock).toHaveBeenCalled();
    expect(mocks.uploadMessageAttachmentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file_abc123',
        fileExtension: 'png',
      }),
    );
    expect(mocks.dbInsertFileWithChunksMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'file_abc123',
        userId: null,
        metadata: expect.objectContaining({
          sharedChatInviteCode: 'invite',
          sharedChatEntityType: 'character',
          sharedChatEntityId: 'character-1',
          sharedChatSessionId: 'session-1',
        }),
      }),
      [],
    );
  });

  it('stores shared non-image uploads with chunks and userId=null', async () => {
    mocks.dbGetLearningScenarioByIdAndInviteCodeMock.mockResolvedValue({
      startedBy: 'teacher-1',
    });

    const { uploadSharedChatFile } = await import('./shared-chat-upload-service');

    const file = new File([new Uint8Array([4, 5, 6])], 'notes.pdf', {
      type: 'application/pdf',
    });

    await uploadSharedChatFile({
      file,
      inviteCode: 'invite',
      entityType: 'learningScenario',
      entityId: 'learning-scenario-1',
      sharedSessionId: 'session-1',
    });

    expect(mocks.fileExtractionXbergMock).toHaveBeenCalled();
    expect(mocks.chunkAndEmbedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fileId: 'file_abc123',
        federalStateId: 'federal-state-1',
      }),
    );
    expect(mocks.dbInsertFileWithChunksMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'file_abc123',
        userId: null,
        metadata: expect.objectContaining({
          sharedChatInviteCode: 'invite',
          sharedChatEntityType: 'learningScenario',
          sharedChatEntityId: 'learning-scenario-1',
          sharedChatSessionId: 'session-1',
        }),
      }),
      expect.any(Array),
    );
  });
});
