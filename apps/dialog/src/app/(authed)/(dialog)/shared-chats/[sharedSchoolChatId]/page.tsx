import { getUser } from '@/auth/utils';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetSharedSchoolChatById } from '@/db/functions/shared-school-chat';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../header-portal';
import SharedSchoolChatForm from './shared-school-chat-form';
import { fetchFileMapping } from './actions';
import ProfileMenu from '@/components/navigation/profile-menu';
import { PageContext } from '@/utils/next/types';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
const pageContextSchema = z.object({
  params: z.object({
    sharedSchoolChatId: z.string(),
  }),
  searchParams: z
    .object({
      create: z.string().optional(),
    })
    .optional(),
});

const PREFETCH_ENABLED = false;

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) notFound();

  const { params, searchParams } = result.data;
  const isCreating = searchParams?.create === 'true';
  const user = await getUser();
  const sharedSchoolChat = await dbGetSharedSchoolChatById({
    userId: user.id,
    sharedChatId: params.sharedSchoolChatId,
  });

  if (!sharedSchoolChat) {
    return notFound();
  }
  const relatedFiles = await fetchFileMapping(params.sharedSchoolChatId);

  const initialLinks = PREFETCH_ENABLED
    ? await Promise.all(
        sharedSchoolChat.attachedLinks
          .filter((l) => l !== '')
          .map((url) => webScraperExecutable(url)),
      )
    : sharedSchoolChat.attachedLinks
        .filter((l) => l && l !== '')
        .map(
          (url) =>
            ({
              link: url,
              type: 'websearch',
              error: false,
            }) as WebsearchSource,
        );

  const maybeSignedPictureUrl = await getMaybeSignedUrlFromS3Get({
    key: sharedSchoolChat.pictureId ? `shared-chats/${sharedSchoolChat.id}/avatar` : undefined,
  });
  return (
    <div className="w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <SharedSchoolChatForm
          {...sharedSchoolChat}
          existingFiles={relatedFiles}
          isCreating={isCreating}
          initialLinks={initialLinks}
          maybeSignedPictureUrl={maybeSignedPictureUrl}
          readOnly={false}
        />
      </div>
    </div>
  );
}
