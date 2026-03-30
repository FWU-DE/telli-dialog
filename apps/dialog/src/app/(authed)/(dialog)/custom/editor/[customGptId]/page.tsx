import AssistantForm from './custom-gpt-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { AssistantSelectModel } from '@shared/db/schema';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getAssistantForEditView, getFileMappings } from '@shared/assistants/assistant-service';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { WebsearchSource } from '@shared/db/types';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
  templateId: z.string().optional(),
});

export default async function Page(props: PageProps<'/custom/editor/[customGptId]'>) {
  const { customGptId: assistantId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const { user, school } = await requireAuth();

  const [assistant, relatedFiles] = await Promise.all([
    getAssistantForEditView({ assistantId, schoolId: school.id, userId: user.id }),
    getFileMappings({
      assistantId,
      userId: user.id,
      schoolId: school.id,
    }),
  ]).catch(handleErrorInServerComponent);

  const avatarPictureUrl = await getAvatarPictureUrl(assistant.pictureId);

  const readOnly = assistant.userId !== user.id;
  const initialLinks = assistant.attachedLinks
    .filter((l) => l !== '')
    .map(
      (url) =>
        ({
          link: url,
          error: false,
        }) as WebsearchSource,
    );

  return (
    <div className="min-w-full p-6 overflow-auto">
      <div className="max-w-3xl mx-auto mt-4">
        <AssistantForm
          {...(removeNullishValues(assistant) as AssistantSelectModel)}
          maybeSignedPictureUrl={avatarPictureUrl}
          isCreating={isCreating}
          readOnly={readOnly}
          userRole={user.userRole}
          initialLinks={initialLinks}
          existingFiles={relatedFiles}
        />
      </div>
    </div>
  );
}
