import { SUPPORTED_FILE_TYPE as SupportedFiles } from '@/const';
import { extractTextFromWordDocument } from './parse-docx';
import { extractTextFromPdfBuffer } from './parse-pdf';
import { CHAT_MESSAGE_LENGTH_LIMIT } from '@/configuration-text-inputs/const';

export async function extractFile({
  fileContent,
  type,
}: {
  fileContent: Buffer;
  type: SupportedFiles;
}): Promise<{ content: string; truncated: boolean }> {
  let content: string = '';
  if (type === 'pdf') {
    content = await extractTextFromPdfBuffer(fileContent);
  } else if (type === 'docx') {
    content = await extractTextFromWordDocument(fileContent);
  } else if (type === 'md' || type === 'txt') {
    content = new TextDecoder('utf-8').decode(fileContent);
  }
  const truncated = content.length > CHAT_MESSAGE_LENGTH_LIMIT;
  content = content.slice(0, CHAT_MESSAGE_LENGTH_LIMIT);
  return { content, truncated };
}
