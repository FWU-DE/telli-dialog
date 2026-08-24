import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { fixInvalidPictureIds } from './fix-invalid-picture-ids';
import { copyFileInS3 } from '@shared/s3';
import { logError, logInfo } from '@shared/logging';

const { mockDbWhere, mockDbSelect, mockUpdateSet, mockDbUpdate, mockClientQuery } = vi.hoisted(
  () => {
    const mockDbWhere = vi.fn();
    const mockDbFrom = vi.fn(() => ({ where: mockDbWhere }));
    const mockDbSelect = vi.fn(() => ({ from: mockDbFrom }));
    const mockUpdateWhere = vi.fn();
    const mockUpdateSet = vi.fn(() => ({ where: mockUpdateWhere }));
    const mockDbUpdate = vi.fn(() => ({ set: mockUpdateSet }));
    const mockClientQuery = vi.fn().mockResolvedValue(undefined);
    return { mockDbWhere, mockDbSelect, mockUpdateSet, mockDbUpdate, mockClientQuery };
  },
);

vi.mock('@shared/db', () => ({
  db: {
    select: mockDbSelect,
    update: mockDbUpdate,
    $client: { query: mockClientQuery },
  },
}));

vi.mock('@shared/s3', () => ({ copyFileInS3: vi.fn() }));
vi.mock('@shared/logging', () => ({ logInfo: vi.fn(), logError: vi.fn() }));

describe('fixInvalidPictureIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockClientQuery.mockResolvedValue(undefined);
    // First select call = assistants, second = characters, in this order.
    mockDbWhere.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
  });

  it('takes and releases an advisory lock around the migration', async () => {
    await fixInvalidPictureIds();

    expect(mockClientQuery).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('pg_advisory_lock'),
      [1000, 100003],
    );
    expect(mockClientQuery).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('pg_advisory_unlock'),
      [1000, 100003],
    );
  });

  it('does nothing when there are no invalid picture ids', async () => {
    await fixInvalidPictureIds();

    expect(copyFileInS3).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('skips rows with a nullish picture id', async () => {
    mockDbWhere.mockReset();
    mockDbWhere
      .mockResolvedValueOnce([{ id: 'assistant-1', pictureId: null }])
      .mockResolvedValueOnce([]);

    await fixInvalidPictureIds();

    expect(copyFileInS3).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
  });

  it('copies the picture and updates the row when the source exists in S3', async () => {
    mockDbWhere.mockReset();
    mockDbWhere
      .mockResolvedValueOnce([
        { id: 'assistant-1', pictureId: 'custom-gpts/other-id/avatar_abc123' },
      ])
      .mockResolvedValueOnce([]);
    (copyFileInS3 as MockedFunction<typeof copyFileInS3>).mockResolvedValue(undefined);

    await fixInvalidPictureIds();

    expect(copyFileInS3).toHaveBeenCalledWith({
      copySource: 'custom-gpts/other-id/avatar_abc123',
      newKey: 'custom-gpts/assistant-1/avatar_abc123',
    });
    expect(mockDbUpdate).toHaveBeenCalledTimes(1);
    expect(mockUpdateSet).toHaveBeenCalledWith({
      pictureId: 'custom-gpts/assistant-1/avatar_abc123',
    });
  });

  it('logs an info note and skips the row when the picture does not exist in S3', async () => {
    mockDbWhere.mockReset();
    mockDbWhere
      .mockResolvedValueOnce([
        { id: 'assistant-1', pictureId: 'custom-gpts/missing-id/avatar_missing' },
      ])
      .mockResolvedValueOnce([]);
    (copyFileInS3 as MockedFunction<typeof copyFileInS3>).mockRejectedValue(new Error('NoSuchKey'));

    await fixInvalidPictureIds();

    expect(mockDbUpdate).not.toHaveBeenCalled();
    expect(logInfo).toHaveBeenCalledWith(expect.stringContaining('assistant-1'));
  });

  it('continues processing other rows when one row fails unexpectedly', async () => {
    mockDbWhere.mockReset();
    mockDbWhere
      .mockResolvedValueOnce([
        { id: 'assistant-1', pictureId: 'custom-gpts/other-id/avatar_abc123' },
        { id: 'assistant-2', pictureId: 'custom-gpts/other-id-2/avatar_def456' },
      ])
      .mockResolvedValueOnce([]);
    mockDbUpdate.mockImplementationOnce(() => {
      throw new Error('DB unavailable');
    });
    (copyFileInS3 as MockedFunction<typeof copyFileInS3>).mockResolvedValue(undefined);

    await fixInvalidPictureIds();

    expect(copyFileInS3).toHaveBeenCalledTimes(2);
    expect(logError).toHaveBeenCalledWith(
      expect.stringContaining('assistant-1'),
      expect.any(Error),
    );
    expect(mockDbUpdate).toHaveBeenCalledTimes(2);
  });

  it('fixes characters using the character picture key convention', async () => {
    mockDbWhere.mockReset();
    mockDbWhere
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 'character-1', pictureId: 'characters/other-id/avatar_abc123' },
      ]);
    (copyFileInS3 as MockedFunction<typeof copyFileInS3>).mockResolvedValue(undefined);

    await fixInvalidPictureIds();

    expect(copyFileInS3).toHaveBeenCalledWith({
      copySource: 'characters/other-id/avatar_abc123',
      newKey: 'characters/character-1/avatar_abc123',
    });
  });
});
