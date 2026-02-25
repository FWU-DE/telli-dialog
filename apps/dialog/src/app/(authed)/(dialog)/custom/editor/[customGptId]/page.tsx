import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../../header-portal';
import CustomGptForm from './custom-gpt-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CustomGptSelectModel } from '@shared/db/schema';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getCustomGptForEditView, getFileMappings } from '@shared/custom-gpt/custom-gpt-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { getAvatarPictureUrl } from '@shared/files/fileService';
import { WebsearchSource } from '@shared/db/types';

export const dynamic = 'force-dynamic';

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
  templateId: z.string().optional(),
});

export default async function Page(props: PageProps<'/custom/editor/[customGptId]'>) {
  const { customGptId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const [customGpt, relatedFiles] = await Promise.all([
    getCustomGptForEditView({ customGptId, schoolId: school.id, userId: user.id }),
    getFileMappings({
      customGptId,
      userId: user.id,
      schoolId: school.id,
    }),
  ]).catch(handleErrorInServerComponent);

  const avatarPictureUrl = await getAvatarPictureUrl(customGpt.pictureId);

  const readOnly = customGpt.userId !== user.id;
  const initialLinks = customGpt.attachedLinks
    .filter((l) => l !== '')
    .map(
      (url) =>
        ({
          link: url,
          type: 'websearch',
          error: false,
        }) as WebsearchSource,
    );

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="grow"></div>
        <ProfileMenu userAndContext={userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CustomGptForm
          {...(removeNullishValues(customGpt) as CustomGptSelectModel)}
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
