import { NextRequest, NextResponse } from 'next/server';
import { generateConversationDocxFiles } from './utils';
import { getUser } from '@/auth/utils';
import { type ConversationModel } from '@/db/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const searchParams = new URLSearchParams(req.url.split('?')[1]);
  const conversationId = searchParams.get('conversationId');
  const enterpriseGptName = searchParams.get('enterpriseGptName');

  const user = await getUser();

  if (conversationId === null) {
    return NextResponse.json({ error: 'Invalid conversation id' }, { status: 404 });
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
        'Content-Length': buffer.length.toString(),
        'X-Filename': encodeURIComponent(fileName),
      },
    });
  } catch (error) {
    console.error('Failed to generate the document', error);
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
