import { SUPPORTED_FILE_TYPE as SupportedFiles, SUPPORTED_IMAGE_EXTENSIONS } from '@/const';
import { extractTextFromWordDocument } from './parse-docx';
import { extractTextFromPdfBuffer } from './parse-pdf';
import { FileMetadata } from '@/db/schema';
import { preprocessImage } from './prepocess-image';

type TextElement = {
  page: number;
  text: string;
};

export async function extractFile({
  fileContent,
  type,
}: {
  fileContent: Buffer;
  type: SupportedFiles;
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
  } else if (SUPPORTED_IMAGE_EXTENSIONS.includes(type)) {
    const imageResult = await preprocessImage(fileContent);
    metadata = imageResult.metadata;
    processedBuffer = imageResult.buffer;
    // Images don't have text content, so content remains empty
    content = [];
  }

  return { content, metadata, processedBuffer };
}
