import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import HeaderPortal from '../../../header-portal';
import CustomGptForm from './custom-gpt-form';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CustomGptModel } from '@shared/db/schema';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { logError } from '@shared/logging';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';
import { getCustomGptForEditView, getFileMappings } from '@shared/custom-gpt/custom-gpt-service';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';
import { handleErrorInServerComponent } from '@shared/error/handle-error-in-server-component';

export const dynamic = 'force-dynamic';
const PREFETCH_ENABLED = false;

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
  templateId: z.string().optional(),
});

export default async function Page(props: PageProps<'/custom/editor/[customgptId]'>) {
  const { customgptId: customGptId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const [customGpt, relatedFiles] = await Promise.all([
    getCustomGptForEditView({ customGptId, userId: user.id }),
    getFileMappings({
      customGptId,
      userId: user.id,
      schoolId: school.id,
    }),
  ]).catch(handleErrorInServerComponent);

  let maybeSignedPictureUrl: string | undefined;
  try {
    maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
      key: customGpt.pictureId,
    });
  } catch (e) {
    logError(
      `Error getting signed picture URL (key: ${customGpt.pictureId}, customGpt id: ${customGpt.id}, template id: ${searchParams.templateId})`,
      e,
    );
  }

  const readOnly = customGpt.userId !== user.id;
  const links = customGpt.attachedLinks;
  const initialLinks = PREFETCH_ENABLED
    ? await Promise.all(links.filter((l) => l !== '').map((url) => webScraperExecutable(url)))
    : links
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
        <div className="flex-grow"></div>
        <ProfileMenu {...userAndContext} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CustomGptForm
          {...(removeNullishValues(customGpt) as CustomGptModel)}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
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
