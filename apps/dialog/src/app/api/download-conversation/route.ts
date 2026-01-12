import { NextRequest, NextResponse } from 'next/server';
import { generateConversationDocxFiles } from './utils';
import { getUser } from '@/auth/utils';
import { type ConversationModel } from '@shared/db/types';
import { logError } from '@shared/logging';
import { getConversation } from '@shared/conversation/conversation-service';

export const dynamic = 'force-dynamic';

/**
 * User wants to download a conversation as a .docx file.
 * We generate the file on the fly and return it as a response.
 * The user must be the owner of the conversation.
 */
export async function GET(req: NextRequest) {
  const searchParams = new URLSearchParams(req.url.split('?')[1]);
  const conversationId = searchParams.get('conversationId');
  const enterpriseGptName = searchParams.get('enterpriseGptName');

  const user = await getUser();

  if (conversationId === null) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 404 });
  }

  // Verify that the user is the owner of the conversation
  try {
    await getConversation({ conversationId, userId: user.id });
  } catch {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  try {
    const conversationObject = await generateConversationDocxFiles({
      conversationId,
      enterpriseGptName,
      user,
      userFullName: 'Nutzer/in',
    });

    if (conversationObject === undefined) {
      return NextResponse.json({ error: 'Failed to generate the document' }, { status: 500 });
    }

    const { buffer, conversation, gptName } = conversationObject;
    const fileName = generateFileName({ conversation, gptName });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': buffer.byteLength.toString(),
        'X-Filename': encodeURIComponent(fileName),
      },
    });
  } catch (error) {
    logError('Failed to generate a document for the conversation', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

function generateFileName({
  conversation,
  gptName,
}: {
  conversation: ConversationModel;
  gptName: string;
}): string {
  const formattedDate = conversation.createdAt.toISOString().split('T')[0];
  const fileName = `${formattedDate} ${gptName} Gespräch über ${conversation.name}.docx`;

  return fileName;
}
