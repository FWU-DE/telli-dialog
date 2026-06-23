import type { ToolDefinition } from '@ais-chat/ai-core';
import { dbGetExtractedFileContent } from '@shared/db/functions/files';
import type { FileModel } from '@shared/db/schema';
import { RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT } from '@/configuration-text-inputs/const';
import type { ToolHandler } from './types';

type RetrieveEntireFileToolResponse = {
  fileName: string | null;
  content: string | null;
  truncated: boolean;
  characterCount: number;
  maxCharacters: number;
  error: string | null;
};

function truncateToCharacterLimit(text: string, maxCharacters: number) {
  if (text.length <= maxCharacters) {
    return text;
  }

  return text.slice(0, maxCharacters);
}

async function formatEntireFileForTool(file: FileModel) {
  const content = await dbGetExtractedFileContent(file.id);
  const characterCount = content.length;
  const truncatedContent = truncateToCharacterLimit(content, RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT);
  const truncated = truncatedContent.length !== content.length;

  const response: RetrieveEntireFileToolResponse = {
    fileName: file.name ?? null,
    content: content.length > 0 ? truncatedContent : null,
    truncated,
    characterCount,
    maxCharacters: RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT,
    error: null,
  };

  if (!content) {
    response.error = 'Keine verwertbaren Inhalte gefunden.';
  } else if (truncated) {
    response.error = 'Dateiinhalt wurde wegen des Zeichenlimits gekürzt.';
  }

  return JSON.stringify(response);
}

type CreateRetrieveEntireFileToolParams = {
  relatedFileEntities: FileModel[];
};

export function createRetrieveEntireFileTool({
  relatedFileEntities,
}: CreateRetrieveEntireFileToolParams): { definition: ToolDefinition; handler: ToolHandler } {
  const attachedFileDescriptions = relatedFileEntities.map(
    (file) => `${file.name} (${file.size} bytes)`,
  );

  const definition: ToolDefinition = {
    name: 'retrieve_entire_file',
    description: `Retrieve the full content of one attached file by name. Available files right now: ${attachedFileDescriptions.join(', ') || 'none'}. Use this tool when you need the full text of a specific attached file instead of only relevant excerpts. The returned content is capped at ${RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT} characters.`,
    parameters: {
      type: 'object',
      properties: {
        fileName: {
          type: 'string',
          description: 'The exact name of the attached file to retrieve.',
        },
      },
      required: ['fileName'],
      additionalProperties: false,
    },
  };

  const handler: ToolHandler = async (args) => {
    const fileName = typeof args.fileName === 'string' ? args.fileName.trim() : '';

    if (fileName.length === 0) {
      const response: RetrieveEntireFileToolResponse = {
        fileName: null,
        content: null,
        truncated: false,
        characterCount: 0,
        maxCharacters: RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT,
        error: 'Fehlender Dateiname.',
      };

      return JSON.stringify(response);
    }

    const matchedFile = relatedFileEntities.find((file) => file.name === fileName);

    if (matchedFile === undefined) {
      const response: RetrieveEntireFileToolResponse = {
        fileName,
        content: null,
        truncated: false,
        characterCount: 0,
        maxCharacters: RETRIEVE_ENTIRE_FILE_CHARACTER_LIMIT,
        error: 'Datei nicht gefunden.',
      };

      return JSON.stringify(response);
    }

    return await formatEntireFileForTool(matchedFile);
  };

  return {
    definition,
    handler,
  };
}
