import { getUser } from '@/auth/utils';
import { db } from '@/db';
import { fileTable } from '@/db/schema';
import { uploadFileToS3 } from '@/s3';
import { getFileExtension } from '@/utils/files/generic';
import { cnanoid } from '@/utils/random';
import { NextRequest, NextResponse } from 'next/server';

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

  const fileExtension = getFileExtension(file.name);

  const searchParams = new URLSearchParams({
    file_type: fileExtension,
    file_id: fileId,
    file_name: file.name,
  });

  await uploadFileToS3({
    key: `message_attachments/${fileId}`,
    body: buffer,
    contentType: getFileExtension(file.name),
  });
  await db
    .insert(fileTable)
    .values({ id: fileId, name: file.name, size: file.size, type: file.type });



  return NextResponse.json({ body: JSON.stringify({ file_id: fileId }), status: 200 });
}
