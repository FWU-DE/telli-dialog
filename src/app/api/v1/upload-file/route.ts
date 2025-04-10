import { getUser } from '@/auth/utils';
import { USER_WARNING_FOR_TRUNCATED_FILES } from '@/configuration-text-inputs/const';
import { db } from '@/db';
import { fileTable } from '@/db/schema';
import { uploadFileToS3 } from '@/s3';
import { getFileExtension } from '@/utils/files/generic';
import { cnanoid } from '@/utils/random';
import { NextRequest, NextResponse } from 'next/server';
import { extractFile } from '../../file-operations/extract-file';

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (user === undefined) {
    return NextResponse.json({ status: 403 });
  }
  const formData = await req.formData();

  const file = formData.get('file');

  if (file === null) {
    return NextResponse.json({ error: 'Could not find file in form data' }, { status: 400 });
  }

  if (typeof file === 'string') {
    return NextResponse.json(
      { error: 'file FormData entry value was of type "string", but expected type "File"' },
      { status: 400 },
    );
  }

  const fileId = `file_${cnanoid()}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { truncated } = await extractFile({
    fileContent: buffer,
    type: getFileExtension(file.name),
  });
  const userWarning = truncated ? USER_WARNING_FOR_TRUNCATED_FILES : null;

  const fileExtension = getFileExtension(file.name);

  await uploadFileToS3({
    key: `message_attachments/${fileId}`,
    body: buffer,
    contentType: getFileExtension(file.name),
  });
  await db
    .insert(fileTable)
    .values({ id: fileId, name: file.name, size: file.size, type: fileExtension });

  return NextResponse.json({
    body: JSON.stringify({ file_id: fileId, warning: userWarning }),
    status: 200,
  });
}
