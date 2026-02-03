import Chat from '@/components/chat/chat';
import { dbGetConversationAndMessages } from '@shared/db/functions/chat';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { redirect } from 'next/navigation';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { dbGetRelatedFiles } from '@shared/db/functions/files';
import { parseHyperlinks } from '@/utils/web-search/parsing';
import Logo from '@/components/common/logo';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { buildLegacyUserAndContext } from '@/auth/types';
import { requireAuth } from '@/auth/requireAuth';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import { WebsearchSource } from '@shared/db/types';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({ model: z.string().optional() });

export default async function Page(props: PageProps<'/d/[conversationId]'>) {
  const { conversationId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);

  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const conversationObject = await dbGetConversationAndMessages({
    conversationId,
    userId: user.id,
  });

  if (conversationObject === undefined) {
    redirect('/');
  }
  const fileMapping = await dbGetRelatedFiles(conversationId);
  const { conversation, messages } = conversationObject;

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: userAndContext.federalState.id,
  });

  const lastUsedModelInChat = messages.at(messages.length - 1)?.modelName ?? undefined;

  const currentModel =
    searchParams.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const convertedMessages = convertMessageModelToMessage(messages);
  const webSourceMapping = new Map<string, WebsearchSource[]>();
  const logoElement = <Logo federalStateId={userAndContext.school.federalStateId} />;

  // Load websearch sources from the database
  // For old messages without stored sources, parse URLs from content to show citations
  // The actual scraping will happen when user sends a new message
  for (const message of messages) {
    if (message.role !== 'user') {
      continue;
    }
    if (message.websearchSources.length > 0) {
      webSourceMapping.set(message.id, message.websearchSources);
    } else {
      const urls = parseHyperlinks(message.content);
      if (urls && urls.length > 0) {
        const websearchSources: WebsearchSource[] = urls.map((url) => ({
          type: 'websearch',
          link: url,
        }));
        webSourceMapping.set(message.id, websearchSources);
      }
    }
  }

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <ChatHeaderBar
        chatId={conversation.id}
        hasMessages={convertedMessages.length > 0}
        userAndContext={userAndContext}
      />
      <Chat
        id={conversation.id}
        initialMessages={convertedMessages}
        initialFileMapping={fileMapping}
        enableFileUpload={true}
        webSourceMapping={webSourceMapping}
        logoElement={logoElement}
      />
    </LlmModelsProvider>
  );
}
