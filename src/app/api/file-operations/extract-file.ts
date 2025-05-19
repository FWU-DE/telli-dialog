import { SUPPORTED_FILE_TYPE as SupportedFiles } from '@/const';
import { extractTextFromWordDocument } from './parse-docx';
import { extractTextFromPdfBuffer } from './parse-pdf';

export async function extractFile({
  fileContent,
  type,
}: {
  fileContent: Buffer;
  type: SupportedFiles;
}): Promise<string> {
  let content: string = '';
  if (type === 'pdf') {
    content = await extractTextFromPdfBuffer(fileContent);
  } else if (type === 'docx') {
    content = await extractTextFromWordDocument(fileContent);
  } else if (type === 'md' || type === 'txt') {
    content = new TextDecoder('utf-8').decode(fileContent);
  }
  return content;
}
