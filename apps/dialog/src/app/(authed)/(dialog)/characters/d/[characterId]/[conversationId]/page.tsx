import HeaderPortal from '@/app/(authed)/(dialog)/header-portal';
import Chat from '@/components/chat/chat';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import Logo from '@/components/common/logo';
import { convertMessageModelToMessage } from '@/utils/chat/messages';
import { requireAuth } from '@/auth/requireAuth';
import {
  getConversation,
  getConversationMessages,
} from '@shared/conversation/conversation-service';
import { getCharacterForChatSession } from '@shared/characters/character-service';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { parseSearchParams } from '@/utils/parse-search-params';
import { z } from 'zod';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import type { ChatMessage as Message } from '@/types/chat';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';
const searchParamsSchema = z.object({ model: z.string().optional() });

export default async function Page(
  props: PageProps<'/characters/d/[characterId]/[conversationId]'>,
) {
  const params = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
  };

  const [chat, rawChatMessages, character] = await Promise.all([
    getConversation({
      conversationId: params.conversationId,
      userId: user.id,
    }),
    getConversationMessages({
      conversationId: params.conversationId,
      userId: user.id,
    }),
    getCharacterForChatSession({
      characterId: params.characterId,
      userId: user.id,
      schoolIds: user.schoolIds ?? [],
    }),
  ]).catch(handleErrorInServerComponent);

  const dbMessages = convertMessageModelToMessage(rawChatMessages);

  // Prepend the character's initial message since it is not persisted in DB
  const chatMessages: Message[] = character.initialMessage
    ? [
        { id: 'initial-message', role: 'assistant', content: character.initialMessage },
        ...dbMessages,
      ]
    : dbMessages;

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });

  const lastUsedModelInChat = rawChatMessages.at(-1)?.modelName;

  const currentModel =
    searchParams.model ?? lastUsedModelInChat ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const avatarPictureUrl = await getAvatarPictureUrl(character.pictureId);
  const logoElement = <Logo logoPath={userAndContext.federalState.pictureUrls?.logo} />;
  return (
    <LlmModelsProvider
      models={models}
      defaultLlmModelByCookie={currentModel}
      initialDownloadConversationEnabled={rawChatMessages.length > 0}
    >
      <HeaderPortal>
        <ChatHeaderBar
          chatId={chat.id}
          title={character.name}
          downloadConversationEnabled={rawChatMessages.length > 0}
          userAndContext={userAndContext}
        />
      </HeaderPortal>
      <DefaultPageLayout>
        <Chat
          id={chat.id}
          initialMessages={chatMessages}
          character={character}
          enableFileUpload={false}
          imageSource={avatarPictureUrl}
          logoElement={logoElement}
        />
      </DefaultPageLayout>
    </LlmModelsProvider>
  );
}
