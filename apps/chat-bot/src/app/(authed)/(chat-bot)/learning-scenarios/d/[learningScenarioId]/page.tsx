import { generateUUID } from '@shared/utils/uuid';
import { notFound } from 'next/navigation';
import { requireAuth } from '@/auth/requireAuth';
import LearningScenarioPreviewChat from '@/components/chat/learning-scenario-preview-chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import { getLearningScenarioForChatSession } from '@shared/learning-scenarios/learning-scenario-service';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';

export const dynamic = 'force-dynamic';

export default async function Page(props: PageProps<'/learning-scenarios/d/[learningScenarioId]'>) {
  const { learningScenarioId } = await props.params;
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
  };

  const learningScenario = await getLearningScenarioForChatSession({
    learningScenarioId,
    user,
  }).catch(() => {
    notFound();
  });

  const models = await dbGetLlmModelsByFederalStateId({
    federalStateId: federalState.id,
  });
  const scenarioModel = models.find((m) => m.id === learningScenario.modelId)?.name;
  const defaultModel = scenarioModel ?? user.lastUsedModel ?? DEFAULT_CHAT_MODEL;

  const previewSessionId = generateUUID();
  const avatarPictureUrl = await getAvatarPictureUrl(learningScenario.pictureId);

  return (
    <LlmModelsProvider models={models} defaultLlmModelByCookie={defaultModel}>
      <DefaultPageLayout
        layoutConfig={{
          layout: 'chat',
          headerConfig: {
            chatId: previewSessionId,
            title: learningScenario.name,
            downloadConversationEnabled: false,
            userAndContext,
          },
        }}
      >
        <LearningScenarioPreviewChat
          previewSessionId={previewSessionId}
          learningScenario={learningScenario}
          maybeSignedPictureUrl={avatarPictureUrl}
        />
      </DefaultPageLayout>
    </LlmModelsProvider>
  );
}
