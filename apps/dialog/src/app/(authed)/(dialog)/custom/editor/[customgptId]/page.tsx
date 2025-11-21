import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCustomGptById, dbGetCopyTemplateCustomGpt } from '@shared/db/functions/custom-gpts';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CustomGptForm from './custom-gpt-form';
import { fetchFileMapping } from '../../actions';
import { removeNullishValues } from '@shared/utils/remove-nullish-values';
import { CustomGptModel } from '@shared/db/schema';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { logError } from '@shared/logging';

export const dynamic = 'force-dynamic';
const PREFETCH_ENABLED = false;

const pageContextSchema = z.object({
  params: z.object({
    customgptId: z.string(),
  }),
  searchParams: z
    .object({
      create: z.string().optional(),
      templateId: z.string().optional(),
    })
    .optional(),
});

export default async function Page(context: PageContext) {
  const { params, searchParams } = pageContextSchema.parse(await awaitPageContext(context));

  const isCreating = searchParams?.create === 'true';

  const user = await getUser();
  const customGpt = await dbGetCustomGptById({ customGptId: params.customgptId });
  const relatedFiles = await fetchFileMapping(params.customgptId);

  if (!customGpt) {
    return notFound();
  }
  let maybeSignedPictureUrl: string | undefined;
  try {
    maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
      key: customGpt.pictureId,
    });
  } catch (e) {
    logError(
      `Error getting signed picture URL (key: ${customGpt.pictureId}, customGpt id: ${customGpt.id}, template id: ${searchParams?.templateId})`,
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
