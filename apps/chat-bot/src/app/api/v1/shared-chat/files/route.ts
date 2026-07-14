import { NextRequest, NextResponse } from 'next/server';
import { handleErrorInRoute } from '@/error/handle-error-in-route';
import { uploadSharedChatFile } from '@/app/api/shared-chat/shared-chat-upload-service';
import { sharedChatUploadFormSchema } from '@/app/api/shared-chat/shared-chat-request-schemas';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const parseResult = sharedChatUploadFormSchema.parse({
      file: formData.get('file'),
      inviteCode: formData.get('inviteCode'),
      entityType: formData.get('entityType'),
      entityId: formData.get('entityId'),
      sharedSessionId: formData.get('sharedSessionId'),
    });

    const fileId = await uploadSharedChatFile({
      file: parseResult.file,
      inviteCode: parseResult.inviteCode,
      entityType: parseResult.entityType,
      entityId: parseResult.entityId,
      sharedSessionId: parseResult.sharedSessionId,
    });

    return NextResponse.json({
      body: JSON.stringify({ file_id: fileId }),
      status: 200,
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}
