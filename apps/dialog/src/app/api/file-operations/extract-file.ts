import { SUPPORTED_DOCUMENTS_TYPE } from '@/const';
import { extractTextFromWordDocument } from './parse-docx';
import { extractTextFromPdfBuffer } from './parse-pdf';
import { FileMetadata } from '@shared/db/schema';
import { preprocessImage } from './preprocess-image';
import { isImageFile } from '@/utils/files/generic';

type TextElement = {
  page: number;
  text: string;
};

export async function extractFile({
  fileContent,
  type,
}: {
  fileContent: Buffer;
  type: SUPPORTED_DOCUMENTS_TYPE;
}): Promise<{ content: TextElement[]; metadata: FileMetadata; processedBuffer?: Buffer }> {
  let content: TextElement[] = [];
  let metadata: FileMetadata = {};
  let processedBuffer: Buffer | undefined;

  if (type === 'pdf') {
    const { pageElement } = await extractTextFromPdfBuffer(fileContent);
    content = pageElement;
  } else if (type === 'docx') {
    const result = await extractTextFromWordDocument(fileContent);
    content = [{ page: 0, text: result }];
  } else if (type === 'md' || type === 'txt') {
    content = [{ page: 0, text: new TextDecoder('utf-8').decode(fileContent) }];
  } else if (isImageFile(type)) {
    const imageResult = await preprocessImage(fileContent, type);
    metadata = imageResult.metadata;
    processedBuffer = imageResult.buffer;
    // Images don't have text content, so content remains empty
    content = [];
  }

  return { content, metadata, processedBuffer };
}
