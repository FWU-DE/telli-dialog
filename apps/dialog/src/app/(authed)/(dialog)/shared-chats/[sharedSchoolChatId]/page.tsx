import { getUser } from '@/auth/utils';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetSharedSchoolChatById } from '@shared/db/functions/shared-school-chat';
import { notFound } from 'next/navigation';
import HeaderPortal from '../../header-portal';
import SharedSchoolChatForm from './shared-school-chat-form';
import { fetchFileMapping } from './actions';
import ProfileMenu from '@/components/navigation/profile-menu';
import { webScraperExecutable } from '@/app/api/conversation/tools/websearch/search-web';
import { getMaybeSignedUrlFromS3Get } from '@shared/s3';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import z from 'zod';
import { parseSearchParams } from '@/utils/parse-search-params';

const PREFETCH_ENABLED = false;

const searchParamsSchema = z.object({ create: z.string().optional().default('false') });

export default async function Page(props: PageProps<'/shared-chats/[sharedSchoolChatId]'>) {
  const { sharedSchoolChatId } = await props.params;
  const searchParams = parseSearchParams(searchParamsSchema, await props.searchParams);
  const isCreating = searchParams.create === 'true';

  const user = await getUser();
  const sharedSchoolChat = await dbGetSharedSchoolChatById({
    userId: user.id,
    sharedChatId: sharedSchoolChatId,
  });

  if (!sharedSchoolChat) {
    notFound();
  }
  const relatedFiles = await fetchFileMapping(sharedSchoolChatId);

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
