import { SUPPORTED_FILE_TYPE as SupportedFiles } from '@/const';
import { extractTextFromWordDocument } from './parse-docx';
import { extractTextFromPdfBuffer } from './parse-pdf';

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
}): Promise<TextElement[]> {
  let content: TextElement[] = [];
  if (type === 'pdf') {
    const { pageElement } = await extractTextFromPdfBuffer(fileContent);
    content = pageElement;
  } else if (type === 'docx') {
    const result = await extractTextFromWordDocument(fileContent);
    content = [{ page: 0, text: result }];
  } else if (type === 'md' || type === 'txt') {
    content = [{ page: 0, text: new TextDecoder('utf-8').decode(fileContent) }];
  }
  return content;
}
