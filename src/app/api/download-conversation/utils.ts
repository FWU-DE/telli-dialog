import {
  Document,
  Packer,
  Paragraph,
  Table,
  TextRun,
  AlignmentType,
  convertInchesToTwip,
} from 'docx';
import { type ConversationModel, type ConversationMessageModel } from '@/db/types';
import { formatDateToGermanTimestamp } from '@/utils/date';
import { dbGetConversationAndMessages } from '@/db/functions/chat';
import { UserModel } from '@/db/schema';
import { markdownToDocx } from './markdown';

export async function generateConversationDocxFiles({
  conversationId,
  user,
  enterpriseGptName,
  userFullName,
}: {
  conversationId: string;
  user: UserModel;
  enterpriseGptName: string | null;
  userFullName: string;
}): Promise<
  | {
      buffer: Buffer;
      conversation: ConversationModel;
      gptName: string;
      messages: ConversationMessageModel[];
    }
  | undefined
> {
  try {
    const conversationObject = await dbGetConversationAndMessages({
      conversationId,
      userId: user.id,
    });

    if (conversationObject === undefined) {
      throw new Error(`Failed to retrieve conversation ${conversationId}`);
    }

    if (conversationObject.conversation.userId !== user.id) {
      throw new Error(`Conversation ${conversationId} does not belong to the user ${user.id}`);
    }
    const { conversation, messages } = conversationObject;

    const conversationMetadata = getConversationMetadata({
      conversation,
    });
    const gptName = await getGptName({ enterpriseGptName });
    const messageParagraphs = getConversationMessages({
      messages,
      gptName,
      userFullName,
    });

    const doc = buildDocxDocument({ conversationMetadata, messageParagraphs });
    const buffer = await Packer.toBuffer(doc);

    return { buffer, conversation, gptName, messages };
  } catch (error) {
    console.error(`Error generating conversation .docx files: ${error}`);
    return undefined;
  }
}

function getConversationMetadata({ conversation }: { conversation: ConversationModel }) {
  return [
    new Paragraph({
      children: [new TextRun({ text: `Konversation: ${conversation.name}`, bold: true, size: 40 })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Erstellt am: ${formatDateToGermanTimestamp(conversation.createdAt)} Uhr`,
          size: 22,
        }),
      ],
    }),
    new Paragraph({}),
  ];
}

type SectionType = Paragraph | Table;
function getConversationMessages({
  messages,
  gptName,
  userFullName,
}: {
  messages: ConversationMessageModel[];
  gptName: string;
  userFullName: string;
}): SectionType[] {
  return messages.flatMap((message: ConversationMessageModel) => [
    new Paragraph({
      children: [
        new TextRun({
          text: `${message.role === 'user' ? userFullName : gptName}:`,
          bold: true,
          size: 22,
        }),
      ],
    }),
    ...markdownToDocx(message.content),
    new Paragraph({}),
  ]);
}

async function getGptName({
  enterpriseGptName,
}: {
  enterpriseGptName: string | null;
}): Promise<string> {
  if (enterpriseGptName) {
    return enterpriseGptName;
  }
  return 'telli';
}

function buildDocxDocument({
  conversationMetadata,
  messageParagraphs,
}: {
  conversationMetadata: Paragraph[];
  messageParagraphs: SectionType[];
}) {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'dgptNumbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.18) },
                },
              },
            },
            {
              level: 1,
              format: 'decimal',
              text: '%2.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.68) },
                },
              },
            },
            {
              level: 2,
              format: 'decimal',
              text: '%3.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(1.18) },
                },
              },
            },
            {
              level: 3,
              format: 'decimal',
              text: '%4.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 2880, hanging: 2420 },
                },
              },
            },
          ],
        },
        {
          reference: 'dgptBullet',
          levels: [
            {
              level: 0,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
            {
              level: 1,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
            {
              level: 2,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: 2160, hanging: convertInchesToTwip(0.25) },
                },
              },
            },
            {
              level: 3,
              format: 'bullet',
              text: '■',
              alignment: 'left',
              style: {
                paragraph: {
                  indent: { left: 2880, hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: {
            font: 'Aptos',
          },
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: [...conversationMetadata, ...messageParagraphs],
      },
    ],
  });

  return doc;
}
