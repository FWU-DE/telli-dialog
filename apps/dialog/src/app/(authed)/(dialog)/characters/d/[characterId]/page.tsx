import { generateUUID } from '@shared/utils/uuid';
import { ChatHeaderBar } from '@/components/chat/header-bar';
import HeaderPortal from '../../../header-portal';
import { notFound } from 'next/navigation';
import Chat from '@/components/chat/chat';
import Logo from '@/components/common/logo';
import { type ChatMessage as Message } from '@/types/chat';
import { getCharacterForChatSession } from '@shared/characters/character-service';
import { requireAuth } from '@/auth/requireAuth';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { parseSearchParams } from '@/utils/parse-search-params';
import { z } from 'zod';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';

export const dynamic = 'force-dynamic';
const searchParamsSchema = z.object({ model: z.string().optional() });

export default async function Page(props: PageProps<'/characters/d/[characterId]'>) {
  const { characterId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);

  const id = generateUUID();
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

  const character = await getCharacterForChatSession({
    characterId,
    userId: user.id,
    schoolIds: user.schoolIds ?? [],
  }).catch(() => {
    notFound();
  });

  const initialMessages: Message[] = character.initialMessage
    ? [{ id: 'initial-message', role: 'assistant', content: character.initialMessage }]
    : [];

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });
  const characterModel = models.find((m) => m.id === character.modelId)?.name;

  const currentModel =
    searchParams.model ?? characterModel ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const avatarPictureUrl = await getAvatarPictureUrl(character.pictureId);
  const logoElement = <Logo logoPath={userAndContext.federalState.pictureUrls?.logo} />;
  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={currentModel}>
      <HeaderPortal>
        <ChatHeaderBar
          chatId={id}
          title={character.name}
          downloadConversationEnabled={false}
          userAndContext={userAndContext}
        />
      </HeaderPortal>
      <DefaultPageLayout>
        <Chat
          id={id}
          initialMessages={initialMessages}
          character={character}
          imageSource={avatarPictureUrl}
          enableFileUpload={false}
          logoElement={logoElement}
        />
      </DefaultPageLayout>
    </LlmModelsProvider>
  );
}
