import NotFound from '@/app/not-found';
import SharedChat from '@/components/chat/shared-chat';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { DEFAULT_DESIGN_CONFIGURATION } from '@shared/db/const';
import { dbGetLlmModelById } from '@shared/db/functions/llm-model';
import { dbGetFederalStateByUserId } from '@shared/db/functions/school';
import { dbGetSharedChatByIdAndInviteCode } from '@shared/db/functions/shared-school-chat';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { awaitPageContext } from '@/utils/next/utils';
import { z } from 'zod';

const pageContextSchema = z.object({
  params: z.object({
    sharedChatId: z.string(),
  }),
  searchParams: z.object({
    inviteCode: z.string(),
  }),
});

export default async function Page(context: {
  params: Promise<{ sharedChatId: string }>;
  searchParams: Promise<{ inviteCode: string }>;
}) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) return <NotFound />;

  const parsedContext = result.data;

  if (!parsedContext) {
    return <NotFound />;
  }

  const { params, searchParams } = parsedContext;

  const sharedSchoolChat = await dbGetSharedChatByIdAndInviteCode({
    id: params.sharedChatId,
    inviteCode: searchParams.inviteCode,
  });

  if (!sharedSchoolChat) {
    return <NotFound />;
  }

  const model = await dbGetLlmModelById({ modelId: sharedSchoolChat.modelId });

  if (!model) {
    return <NotFound />;
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
