import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { notFound } from 'next/navigation';
import HeaderPortal from '../../../header-portal';
import CustomGptForm from './custom-gpt-form';
import { fetchFileMapping } from '../../actions';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CustomGptModel } from '@shared/db/schema';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { logError } from '@shared/logging';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';

export const dynamic = 'force-dynamic';
const PREFETCH_ENABLED = false;

const searchParamsSchema = z.object({
  create: z.string().optional().default('false'),
  templateId: z.string().optional(),
});

export default async function Page(props: PageProps<'/custom/editor/[customgptId]'>) {
  const { customgptId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const user = await getUser();
  const customGpt = await dbGetCustomGptById({ customGptId: customgptId });
  const relatedFiles = await fetchFileMapping(customgptId);

  if (!customGpt) {
    notFound();
  }
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
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CustomGptForm
          {...(removeNullishValues(customGpt) as CustomGptModel)}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          isCreating={isCreating}
          readOnly={readOnly}
          userRole={user.school.userRole}
          initialLinks={initialLinks}
          existingFiles={relatedFiles}
        />
      </div>
    </div>
  );
}
