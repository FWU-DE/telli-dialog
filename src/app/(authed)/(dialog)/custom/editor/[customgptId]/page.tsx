import { getUser } from '@/auth/utils';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetCustomGptById, dbGetCopyTemplateCustomGpt } from '@/db/functions/custom-gpts';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../../header-portal';
import CustomGptForm from './custom-gpt-form';
import { fetchFileMapping } from '../../actions';
import { removeNullValues } from '@/utils/generic/object-operations';
import { CustomGptModel } from '@/db/schema';

export const dynamic = 'force-dynamic';

async function getMaybeDefaultTemplateCustomGpt({
  templateId,
  customGptId,
  userId,
}: {
  templateId?: string;
  customGptId: string;
  userId: string;
}) {
  if (templateId === undefined) return undefined;
  return await dbGetCopyTemplateCustomGpt({
    templateId,
    customGptId: customGptId,
    userId: userId,
  });
}

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
  const templateId = searchParams?.templateId;

  const user = await getUser();

  const customGpt = await dbGetCustomGptById({ customGptId: params.customgptId });
  const relatedFiles = await fetchFileMapping(params.customgptId);

  if (!customGpt) {
    return notFound();
  }

  const defaultTemplateCustomGpt = await getMaybeDefaultTemplateCustomGpt({
    templateId: templateId,
    customGptId: customGpt.id,
    userId: user.id,
  });

  const copyOfTemplatePicture =
    templateId !== undefined ? `custom-gpts/${customGpt.id}/avatar` : undefined;

  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
    key: customGpt.pictureId ?? copyOfTemplatePicture,
  });

  const readOnly = customGpt.userId !== user.id;

  const mergedCustomGpt = {
    ...removeNullValues(customGpt),
    ...removeNullValues(defaultTemplateCustomGpt),
  } as CustomGptModel;

  return (
    <div className="min-w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <CustomGptForm
          {...mergedCustomGpt}
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
