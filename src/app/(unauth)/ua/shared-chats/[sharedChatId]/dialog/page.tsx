import { dbGetSharedChatByIdAndInviteCode } from '@/db/functions/shared-school-chat';
import { z } from 'zod';
import { LlmModelsProvider } from '@/components/providers/llm-model-provider';
import { dbGetLlmModelById } from '@/db/functions/llm-model';
import NotFound from '@/app/not-found';
import SharedChat from './shared-chat';

const pageContextSchema = z.object({
  params: z.object({
    sharedChatId: z.string(),
  }),
  searchParams: z.object({
    inviteCode: z.string(),
  }),
});

async function safeParse(context: {
  params: Promise<{ sharedChatId: string }>;
  searchParams: Promise<{ inviteCode: string }>;
}) {
  const resolvedParams = await context.params;
  const resolvedSearchParams = await context.searchParams;
  const parseResult = pageContextSchema.safeParse({
    params: resolvedParams,
    searchParams: resolvedSearchParams,
  });

  if (parseResult.success) {
    return parseResult.data;
  }

  return null;
}

export default async function Page(context: {
  params: Promise<{ sharedChatId: string }>;
  searchParams: Promise<{ inviteCode: string }>;
}) {
  const parsedContext = await safeParse(context);

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
