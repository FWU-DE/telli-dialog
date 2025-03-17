import { dbDeleteOutdatedConversations } from '@/db/functions/conversation';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const count = await dbDeleteOutdatedConversations();

  return NextResponse.json({ message: 'Ok', count }, { status: 200 });
}
