import { NextRequest, NextResponse } from 'next/server';
import {
  generateConversationDocxFile,
  generateConversationMessageDocxFile,
  generateMessageFileName,
} from './utils';
import { getUser } from '@/auth/utils';
import { type ConversationModel } from '@shared/db/types';
import {
  getConversationAndMessagesForExport,
  getConversationMessageForExport,
} from '@shared/conversation/conversation-service';
import z from 'zod';
import { handleErrorInRoute } from '@/error/handle-error-in-route';

export const dynamic = 'force-dynamic';

const DEFAULT_GPT_NAME = 'telli';

const downloadConversationParamsSchema = z.object({
  conversationId: z.string(),
  messageId: z.string().optional(),
  enterpriseGptName: z.string().optional(),
});

/**
 * User wants to download a conversation or a single message as a .docx file.
 * We generate the file on the fly and return it as a response.
 * The user must be the owner of the conversation.
 *
 * enterpriseGptName contains the character name if a character was used.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const { conversationId, messageId, enterpriseGptName } = downloadConversationParamsSchema.parse(
      Object.fromEntries(searchParams.entries()),
    );

    const user = await getUser();
    const gptName = enterpriseGptName || DEFAULT_GPT_NAME;

    let document: ArrayBuffer | undefined;
    let fileName: string;

    if (messageId === undefined) {
      const { conversation, messages } = await getConversationAndMessagesForExport({
        conversationId,
        userId: user.id,
      });

      document = await generateConversationDocxFile({
        conversation,
        messages,
        gptName,
      });

      fileName = generateFileName({ conversation, gptName });
    } else {
      const { conversation, message, messages } = await getConversationMessageForExport({
        conversationId,
        messageId,
        userId: user.id,
      });

      document = await generateConversationMessageDocxFile({
        conversation,
        messages,
        gptName,
      });

      fileName = generateMessageFileName({
        conversationName: conversation.name,
        gptName,
        createdAt: message.createdAt,
        role: message.role, // Hinzufügen des fehlenden role-Properties
      });
    }

    if (document === undefined) {
      return NextResponse.json({ error: 'Failed to generate the document' }, { status: 500 });
    }

    return new NextResponse(document, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Length': document.byteLength.toString(),
        'X-Filename': encodeURIComponent(fileName),
      },
    });
  } catch (error) {
    return handleErrorInRoute(error);
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
