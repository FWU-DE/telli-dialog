import NotFound from '@/app/not-found';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelById } from '@/db/functions/llm-model';
import { dbGetSharedChatByIdAndInviteCode } from '@/db/functions/shared-school-chat';
import { awaitPageContext } from '@/utils/next/utils';
import { z } from 'zod';
import SharedChat from './shared-chat';

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

  return (
    <main className="h-[100dvh] w-full">
      <LlmModelsProvider models={[model]} defaultLlmModelByCookie={model.name}>
        <SharedChat {...sharedSchoolChat} inviteCode={searchParams.inviteCode} />
      </LlmModelsProvider>
    </main>
  );
}
