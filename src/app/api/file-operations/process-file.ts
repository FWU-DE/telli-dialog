import { FileModelAndContent, fileTable } from '@/db/schema';
import { readFileFromS3 } from '@/s3';
import { dbGetFilesInIds } from '@/db/functions/files';
import { extractFile } from './extract-file';
import { getFileExtension } from '@/utils/files/generic';

export async function process_files(fileIds: string[]): Promise<FileModelAndContent[]> {
  const maybeFiles = await dbGetFilesInIds(fileIds);
  const fileContents = await Promise.all(
    maybeFiles.map((file) => {
      return readFileFromS3({ key: `message_attachments/${file.id}` });
    }),
  );
  fileTable;
  if (maybeFiles[0] === undefined) {
    return [];
  }
  let i = 0;
  for (const fileEnity of maybeFiles) {
    const content = fileContents[i];
    if (content === undefined) continue;
    const fileType = getFileExtension(fileEnity.name)
    fileEnity.content = await extractFile({fileContent: content, type: fileType});
    i++;
  }
  return maybeFiles;
}

