import Chat from '@/components/chat/chat';
import { dbGetConversationAndMessages } from '@shared/db/functions/chat';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { redirect } from 'next/navigation';
import { WebsearchSource } from '@/app/api/webpage-content/types';
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
import { webScraper } from '@/app/api/webpage-content/search-web';

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

  for (const message of convertedMessages) {
    if (message.role !== 'user') {
      continue;
    }
    const urls = parseHyperlinks(message.content);
    if (urls === undefined) {
      continue;
    }
    const webSearchPromises = urls?.map((url) => webScraper(url));

    try {
      const websearchSources = await Promise.all(webSearchPromises ?? []);
      if (websearchSources === undefined || websearchSources.length === 0) {
        continue;
      }
      webSourceMapping.set(
        message.id,
        websearchSources.map((source) => {
          return source;
        }),
      );
    } catch (error) {
      console.error('Error fetching webpage content:', error);
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
