import SharedChat from '@/components/chat/shared-chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { DEFAULT_DESIGN_CONFIGURATION } from '@/db/const';
import { parseSearchParams } from '@/utils/parse-search-params';
import { dbGetLlmModelById } from '@shared/db/functions/llm-model';
import { dbGetFederalStateByUserId } from '@shared/db/functions/school';
import { dbGetSharedChatByIdAndInviteCode } from '@shared/db/functions/shared-school-chat';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { notFound } from 'next/navigation';
import z from 'zod';

const searchParamsSchema = z.object({ inviteCode: z.string() });

export default async function Page(props: PageProps<'/ua/shared-chats/[sharedChatId]/dialog'>) {
  const { sharedChatId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);

  const sharedSchoolChat = await dbGetSharedChatByIdAndInviteCode({
    id: sharedChatId,
    inviteCode: searchParams.inviteCode,
  });

  if (!sharedSchoolChat) {
    notFound();
  }

  const model = await dbGetLlmModelById({ modelId: sharedSchoolChat.modelId });

  if (!model) {
    notFound();
  }

  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
    key: sharedSchoolChat.pictureId,
  });

  const federalState = await dbGetFederalStateByUserId({ userId: sharedSchoolChat.userId });
  const designConfiguration = federalState?.designConfiguration ?? DEFAULT_DESIGN_CONFIGURATION;

  return (
    <main className="h-[100dvh] w-full">
      <LlmModelsProvider models={[model]} defaultLlmModelByCookie={model.name}>
        <ThemeProvider designConfiguration={designConfiguration}>
          <SharedChat
            {...sharedSchoolChat}
            inviteCode={searchParams.inviteCode}
            maybeSignedPictureUrl={maybeSignedPictureUrl}
          />
        </ThemeProvider>
      </LlmModelsProvider>
    </main>
  );
}
