
import { getUser } from '@/auth/utils';
import { db } from '@/db';
import { fileTable } from '@/db/schema';
import { env } from '@/env';
import { getFileExtension } from '@/utils/files/generic';
import { cnanoid } from '@/utils/random';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  await getUser();
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

  const fileExtension = getFileExtension(file.name);

  const searchParams = new URLSearchParams({
    file_type: fileExtension,
    file_id: fileId,
    file_name: file.name,
  });

//   try {
//     const v1FilesResponse = await fetch(
//       `${env.completionServerUrl}/embed-file?${searchParams.toString()}`,
//       {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${env.completionApiKey}`,
//         },
//         body: formData,
//       },
//     );

//     if (!v1FilesResponse.ok) {
//       const errorText = await v1FilesResponse.text();
//       return NextResponse.json({ error: errorText }, { status: v1FilesResponse.status });
//     }

//     const result = await v1FilesResponse.json();

//     await db
//       .insert(fileTable)
//       .values({ id: fileId, name: file.name, size: file.size, type: file.type });

//     return NextResponse.json(result, { status: v1FilesResponse.status });
//   } catch (error) {
//     console.error('Error calling files upload route:', error);
//     return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
//   }

  return NextResponse.json({body:JSON.stringify({file_id:fileId}), status: 200})
}
