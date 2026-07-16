import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

const mocks = vi.hoisted(() => ({
  dbSelectMock: vi.fn(),
  dbDeleteMock: vi.fn(),
  addDaysMock: vi.fn(),
  isSharedChatFileMetadataMock: vi.fn(),
  deleteMessageAttachmentsMock: vi.fn(),
}));

vi.mock('@shared/db', () => ({
  db: {
    select: mocks.dbSelectMock,
    delete: mocks.dbDeleteMock,
  },
}));

vi.mock('@shared/utils/date', () => ({
  addDays: mocks.addDaysMock,
}));

vi.mock('.', () => ({
  isSharedChatFileMetadata: mocks.isSharedChatFileMetadataMock,
}));

vi.mock('@shared/files/fileService', () => ({
  deleteMessageAttachments: mocks.deleteMessageAttachmentsMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.addDaysMock.mockImplementation((date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  });
  mocks.dbDeleteMock.mockReturnValue({
    where: vi.fn(() => Promise.resolve()),
  });
  mocks.deleteMessageAttachmentsMock.mockResolvedValue(undefined);
});

beforeAll(() => {
  process.env.OTC_ACCESS_KEY_ID = 'test-access-key-id';
  process.env.OTC_SECRET_ACCESS_KEY = 'test-secret-access-key';
  process.env.OTC_BUCKET_NAME = 'test-bucket-name';
  process.env.OTC_S3_HOSTNAME = 's3.test.local';
});

afterAll(() => {
  process.env = originalEnv;
});

describe('cleanupExpiredSharedChatFiles', () => {
  it('returns 0 when no files exist', async () => {
    mocks.dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([])),
      })),
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(0);
  });

  it('returns 0 when files have invalid metadata', async () => {
    mocks.dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() =>
          Promise.resolve([
            {
              id: 'file-1',
              metadata: { invalid: 'metadata' },
            },
            {
              id: 'file-2',
              metadata: null,
            },
          ]),
        ),
      })),
    });
    mocks.isSharedChatFileMetadataMock.mockReturnValue(false);

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(0);
  });

  it('deletes files from expired character shares', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
    ];

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-1',
                  entityId: 'character-1',
                },
              ]),
            ),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(1);
  });

  it('deletes files from expired learning scenario shares', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-2',
        metadata: {
          inviteCode: 'invite-2',
          entityType: 'learningScenario',
          entityId: 'scenario-1',
        },
      },
    ];

    let selectCallCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (selectCallCount === 2) {
        // Learning scenario shares query (character shares returns [] immediately without calling db.select)
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-2',
                  entityId: 'scenario-1',
                },
              ]),
            ),
          })),
        };
      }

      throw new Error(`Unexpected db.select call #${selectCallCount}`);
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(1);
  });

  it('deletes multiple files from both character and scenario shares', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
      {
        id: 'file-2',
        metadata: {
          inviteCode: 'invite-2',
          entityType: 'character',
          entityId: 'character-2',
        },
      },
      {
        id: 'file-3',
        metadata: {
          inviteCode: 'invite-3',
          entityType: 'learningScenario',
          entityId: 'scenario-1',
        },
      },
      {
        id: 'file-4',
        metadata: {
          inviteCode: 'invite-4',
          entityType: 'learningScenario',
          entityId: 'scenario-2',
        },
      },
    ];

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-1',
                  entityId: 'character-1',
                },
                {
                  inviteCode: 'invite-2',
                  entityId: 'character-2',
                },
              ]),
            ),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-3',
                  entityId: 'scenario-1',
                },
                {
                  inviteCode: 'invite-4',
                  entityId: 'scenario-2',
                },
              ]),
            ),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(4);
  });

  it('does not delete files when shares have not yet expired (outside cutoff date)', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
    ];

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query - empty, shares not expired
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(0);
  });

  it('handles mixed expired and non-expired files correctly', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
      {
        id: 'file-2',
        metadata: {
          inviteCode: 'invite-2',
          entityType: 'character',
          entityId: 'character-2',
        },
      },
    ];

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query - only one expired
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-1',
                  entityId: 'character-1',
                },
              ]),
            ),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(1);
  });

  it('correctly calculates cutoff date with EXPIRATION_OFFSET_IN_DAYS', async () => {
    const now = new Date();
    const expectedCutoff = new Date(now);
    expectedCutoff.setDate(expectedCutoff.getDate() - 1);

    mocks.addDaysMock.mockReturnValue(expectedCutoff);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
    ];

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query - no expired
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    await cleanupExpiredSharedChatFiles();

    expect(mocks.addDaysMock).toHaveBeenCalledWith(expect.any(Date), -1);
  });

  it('skips files with invalid metadata format', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
      {
        id: 'file-2',
        metadata: { incomplete: 'data' },
      },
      {
        id: 'file-3',
        metadata: {
          inviteCode: 'invite-3',
          entityType: 'learningScenario',
          entityId: 'scenario-1',
        },
      },
    ];

    mocks.isSharedChatFileMetadataMock.mockImplementation((metadata) => {
      return (
        metadata &&
        typeof metadata === 'object' &&
        'inviteCode' in metadata &&
        'entityType' in metadata &&
        'entityId' in metadata
      );
    });

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-1',
                  entityId: 'character-1',
                },
              ]),
            ),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-3',
                  entityId: 'scenario-1',
                },
              ]),
            ),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(2);
  });

  it('returns 0 when no file IDs match expired shares', async () => {
    const cutoffDate = new Date('2026-07-14');
    mocks.addDaysMock.mockReturnValue(cutoffDate);
    mocks.isSharedChatFileMetadataMock.mockReturnValue(true);

    const maybeSharedFiles = [
      {
        id: 'file-1',
        metadata: {
          inviteCode: 'invite-1',
          entityType: 'character',
          entityId: 'character-1',
        },
      },
      {
        id: 'file-2',
        metadata: {
          inviteCode: 'invite-2',
          entityType: 'character',
          entityId: 'character-2',
        },
      },
    ];

    let callCount = 0;
    mocks.dbSelectMock.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // Files query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve(maybeSharedFiles)),
          })),
        };
      } else if (callCount === 2) {
        // Character shares query - returns expired shares with different IDs
        return {
          from: vi.fn(() => ({
            where: vi.fn(() =>
              Promise.resolve([
                {
                  inviteCode: 'invite-3',
                  entityId: 'character-3',
                },
              ]),
            ),
          })),
        };
      } else {
        // Learning scenario shares query
        return {
          from: vi.fn(() => ({
            where: vi.fn(() => Promise.resolve([])),
          })),
        };
      }
    });

    const { cleanupExpiredSharedChatFiles } = await import('./shared-chat-cleanup-service');
    const result = await cleanupExpiredSharedChatFiles();

    expect(result).toBe(0);
  });
});
