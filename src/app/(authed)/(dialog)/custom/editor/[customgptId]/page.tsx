import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCustomGptById } from '@/db/functions/custom-gpts';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CustomGptForm from './custom-gpt-form';
import { fetchFileMapping } from '../../actions';

export const dynamic = 'force-dynamic';

const pageContextSchema = z.object({
  params: z.object({
    customgptId: z.string(),
  }),
  searchParams: z
    .object({
      create: z.string().optional(),
    })
    .optional(),
});

export default async function Page(context: PageContext) {
  const { params, searchParams } = pageContextSchema.parse(await awaitPageContext(context));

  const isCreating = searchParams?.create === 'true';

  const user = await getUser();
  console.log('isCreating', isCreating);
  const customGpt = await dbGetCustomGptById({ customGptId: params.customgptId });
  const relatedFiles = await fetchFileMapping(params.customgptId);

  if (!customGpt) {
    return notFound();
  }
  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({ key: customGpt.pictureId });
  const readOnly = customGpt.userId !== user.id;

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CustomGptForm
          {...customGpt}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          isCreating={isCreating}
          readOnly={readOnly}
          userRole={user.school.userRole}
          existingFiles={relatedFiles}
        />
      </div>
    </div>
  );
}
