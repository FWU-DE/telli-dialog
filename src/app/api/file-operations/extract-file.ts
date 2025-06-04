import { SUPPORTED_FILE_TYPE } from '@/const';
import { extractTextFromWordDocument } from './parse-docx';
import { extractTextFromPdfBuffer } from './parse-pdf';
import { FileMetadata } from '@/db/schema';
import { preprocessImage } from './prepocess-image';
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
  type: SUPPORTED_FILE_TYPE;
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
    const imageResult = await preprocessImage(fileContent);
    metadata = imageResult.metadata;
    processedBuffer = imageResult.buffer;
    // Images don't have text content, so content remains empty
    content = [];
  }

  return { content, metadata, processedBuffer };
}
