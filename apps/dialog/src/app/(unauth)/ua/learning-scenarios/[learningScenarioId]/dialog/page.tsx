import SharedChat from '@/components/chat/shared-chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { DEFAULT_DESIGN_CONFIGURATION } from '@/db/const';
import { parseSearchParams } from '@/utils/parse-search-params';
import { dbGetLlmModelById } from '@shared/db/functions/llm-model';
import { dbGetFederalStateByUserId } from '@shared/db/functions/school';
import { dbGetLearningScenarioByIdAndInviteCode } from '@shared/db/functions/learning-scenario';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { notFound } from 'next/navigation';
import z from 'zod';

const searchParamsSchema = z.object({ inviteCode: z.string() });

export default async function Page(
  props: PageProps<'/ua/learning-scenarios/[learningScenarioId]/dialog'>,
) {
  const { learningScenarioId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);

  const learningScenario = await dbGetLearningScenarioByIdAndInviteCode({
    learningScenarioId,
    inviteCode: searchParams.inviteCode,
  });

  if (!learningScenario) {
    notFound();
  }

  const model = await dbGetLlmModelById({ modelId: learningScenario.modelId });

  if (!model) {
    notFound();
  }

  const avatarPictureUrl = await getAvatarPictureUrl(learningScenario.pictureId);

  const federalState = await dbGetFederalStateByUserId({ userId: learningScenario.userId });
  const designConfiguration = federalState?.designConfiguration ?? DEFAULT_DESIGN_CONFIGURATION;

  return (
    <main className="h-[100dvh] w-full">
      <LlmModelsProvider models={[model]} defaultLlmModelByCookie={model.name}>
        <ThemeProvider designConfiguration={designConfiguration}>
          <SharedChat
            {...learningScenario}
            inviteCode={searchParams.inviteCode}
            maybeSignedPictureUrl={avatarPictureUrl}
          />
        </ThemeProvider>
      </LlmModelsProvider>
    </main>
  );
}
