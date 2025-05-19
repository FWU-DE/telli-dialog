import { FileModelAndContent } from '@/db/schema';
import { readFileFromS3 } from '@/s3';
import { extractFile } from './extract-file';
import { getFileExtension } from '@/utils/files/generic';

export async function process_files(
  maybeFiles: FileModelAndContent[],
): Promise<FileModelAndContent[]> {
  const fileContents = await Promise.all(
    maybeFiles.map((file) => {
      return readFileFromS3({ key: `message_attachments/${file.id}` });
    }),
  );

  if (maybeFiles[0] === undefined) {
    return [];
  }
  let i = 0;
  for (const fileEnity of maybeFiles) {
    const content = fileContents[i];
    if (content === undefined) continue;
    const fileType = getFileExtension(fileEnity.name);
    const extractedData = await extractFile({ fileContent: content, type: fileType });
    fileEnity.content = extractedData;
    i++;
  }
  return maybeFiles;
}
