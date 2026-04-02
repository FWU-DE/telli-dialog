import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { copyAssistant, copyRelatedTemplateFiles, createTemplateFromUrl } from './template-service';
import { dbGetAssistantById, dbUpsertAssistant } from '@shared/db/functions/assistants';
import {
  dbGetFilesForLearningScenario,
  dbGetRelatedAssistantFiles,
  dbGetRelatedCharacterFiles,
} from '@shared/db/functions/files';
import {
  duplicateFileWithEmbeddings,
  linkFileToAssistant,
  linkFileToCharacter,
  linkFileToLearningScenario,
} from '@shared/files/fileService';
import { logError } from '@shared/logging';

vi.mock('@shared/db/functions/assistants', () => ({
  dbGetAssistantById: vi.fn(),
  dbUpsertAssistant: vi.fn(),
}));

vi.mock('@shared/db/functions/files', () => ({
  dbGetRelatedAssistantFiles: vi.fn(),
  dbGetRelatedCharacterFiles: vi.fn(),
  dbGetFilesForLearningScenario: vi.fn(),
}));

vi.mock('@shared/files/fileService', () => ({
  duplicateFileWithEmbeddings: vi.fn(),
  linkFileToAssistant: vi.fn(),
  linkFileToCharacter: vi.fn(),
  linkFileToLearningScenario: vi.fn(),
  copyAvatarPicture: vi.fn(),
}));

vi.mock('@shared/logging', () => ({
  logError: vi.fn(),
}));

describe('template-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('copyAssistant', () => {
    it('should use duplicateAssistantName when provided', async () => {
      const originalId = 'assistant-origin';
      const sourceAssistant = {
        id: originalId,
        name: 'Original name',
        description: 'description',
        hasLinkAccess: true,
      };
      const upsertedAssistant = { id: 'assistant-copy', name: 'Duplicated assistant' };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        sourceAssistant as never,
      );
      (dbUpsertAssistant as MockedFunction<typeof dbUpsertAssistant>).mockResolvedValue(
        upsertedAssistant as never,
      );

      const result = await copyAssistant(
        originalId,
        'private',
        'user-1',
        'school-1',
        'Duplicated assistant',
      );

      expect(dbGetAssistantById).toHaveBeenCalledWith({ assistantId: originalId });
      expect(dbUpsertAssistant).toHaveBeenCalledWith({
        assistant: expect.objectContaining({
          name: 'Duplicated assistant',
          originalAssistantId: originalId,
          accessLevel: 'private',
          userId: 'user-1',
          schoolId: 'school-1',
          isDeleted: false,
          hasLinkAccess: false,
        }),
      });
      expect(result).toBe(upsertedAssistant);
    });

    it('should fallback to source name when duplicateAssistantName is not provided', async () => {
      const sourceAssistant = {
        id: 'assistant-origin',
        name: 'Source assistant name',
      };
      const upsertedAssistant = { id: 'assistant-copy', name: 'Source assistant name' };

      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        sourceAssistant as never,
      );
      (dbUpsertAssistant as MockedFunction<typeof dbUpsertAssistant>).mockResolvedValue(
        upsertedAssistant as never,
      );

      await copyAssistant('assistant-origin', 'global', 'user-1', null);

      expect(dbUpsertAssistant).toHaveBeenCalledWith({
        assistant: expect.objectContaining({
          name: 'Source assistant name',
          schoolId: null,
          accessLevel: 'global',
        }),
      });
    });

    it('should throw if source assistant does not exist', async () => {
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue(
        undefined as never,
      );

      await expect(copyAssistant('missing-id', 'private', 'user-1', 'school-1')).rejects.toThrow(
        'Assistent nicht gefunden',
      );
    });

    it('should throw if upserted assistant has no id', async () => {
      (dbGetAssistantById as MockedFunction<typeof dbGetAssistantById>).mockResolvedValue({
        id: 'assistant-origin',
        name: 'Original name',
      } as never);
      (dbUpsertAssistant as MockedFunction<typeof dbUpsertAssistant>).mockResolvedValue(
        {} as never,
      );

      await expect(
        copyAssistant('assistant-origin', 'private', 'user-1', 'school-1'),
      ).rejects.toThrow('Fehler beim Erstellen des Assistenten');
    });
  });

  describe('copyRelatedTemplateFiles', () => {
    it('should copy and link files for custom-gpt templates', async () => {
      (
        dbGetRelatedAssistantFiles as MockedFunction<typeof dbGetRelatedAssistantFiles>
      ).mockResolvedValue([{ id: 'file-1' }] as never);
      (
        duplicateFileWithEmbeddings as MockedFunction<typeof duplicateFileWithEmbeddings>
      ).mockResolvedValue('file-copy-1' as never);

      await copyRelatedTemplateFiles('custom-gpt', 'template-1', 'result-1');

      expect(duplicateFileWithEmbeddings).toHaveBeenCalledWith('file-1');
      expect(linkFileToAssistant).toHaveBeenCalledWith('file-copy-1', 'result-1');
    });

    it('should copy and link files for character templates', async () => {
      (
        dbGetRelatedCharacterFiles as MockedFunction<typeof dbGetRelatedCharacterFiles>
      ).mockResolvedValue([{ id: 'file-2' }] as never);
      (
        duplicateFileWithEmbeddings as MockedFunction<typeof duplicateFileWithEmbeddings>
      ).mockResolvedValue('file-copy-2' as never);

      await copyRelatedTemplateFiles('character', 'template-2', 'result-2');

      expect(duplicateFileWithEmbeddings).toHaveBeenCalledWith('file-2');
      expect(linkFileToCharacter).toHaveBeenCalledWith('file-copy-2', 'result-2');
    });

    it('should copy and link files for learning-scenario templates', async () => {
      (
        dbGetFilesForLearningScenario as MockedFunction<typeof dbGetFilesForLearningScenario>
      ).mockResolvedValue([{ id: 'file-3' }] as never);
      (
        duplicateFileWithEmbeddings as MockedFunction<typeof duplicateFileWithEmbeddings>
      ).mockResolvedValue('file-copy-3' as never);

      await copyRelatedTemplateFiles('learning-scenario', 'template-3', 'result-3');

      expect(duplicateFileWithEmbeddings).toHaveBeenCalledWith('file-3');
      expect(linkFileToLearningScenario).toHaveBeenCalledWith('file-copy-3', 'result-3');
    });

    it('should continue processing when duplicating one file fails', async () => {
      (
        dbGetRelatedAssistantFiles as MockedFunction<typeof dbGetRelatedAssistantFiles>
      ).mockResolvedValue([{ id: 'file-1' }, { id: 'file-2' }] as never);
      (duplicateFileWithEmbeddings as MockedFunction<typeof duplicateFileWithEmbeddings>)
        .mockRejectedValueOnce(new Error('copy failed'))
        .mockResolvedValueOnce('file-copy-2' as never);

      await copyRelatedTemplateFiles('custom-gpt', 'template-1', 'result-1');

      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('Error copying file file-1'),
        expect.any(Error),
      );
      expect(linkFileToAssistant).toHaveBeenCalledWith('file-copy-2', 'result-1');
    });

    it('should log and swallow errors for invalid template type', async () => {
      await expect(
        copyRelatedTemplateFiles('invalid-template-type' as never, 'template-1', 'result-1'),
      ).resolves.not.toThrow();

      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('Error processing files'),
        expect.any(Error),
      );
    });
  });

  describe('createTemplateFromUrl', () => {
    it('should throw on invalid url format', async () => {
      await expect(createTemplateFromUrl('/invalid/url')).rejects.toThrow('Invalid url format.');
    });
  });
});
