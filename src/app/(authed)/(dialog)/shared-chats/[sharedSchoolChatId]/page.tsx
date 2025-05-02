import { getUser } from '@/auth/utils';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetSharedSchoolChatById } from '@/db/functions/shared-school-chat';
import { awaitPageContext } from '@/utils/next/utils';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../header-portal';
import SharedSchoolChatEditForm from './shared-school-chat-edit-form';
import { fetchFileMapping } from './actions';
import ProfileMenu from '@/components/navigation/profile-menu';

const pageContextSchema = z.object({
  params: z.object({
    sharedSchoolChatId: z.string(),
  }),
});

export default function SharedSchoolChatPage({
  params,
}: {
  params: { sharedSchoolChatId: string };
}) {
  const result = pageContextSchema.safeParse(await awaitPageContext(params));
  if (!result.success) notFound();

  const { params: parsedParams } = result.data;
  const [user] = await Promise.all([getUser()]);

  const sharedSchoolChat = await dbGetSharedSchoolChatById({
    userId: user.id,
    sharedChatId: parsedParams.sharedSchoolChatId,
  });

  if (!sharedSchoolChat) {
    return notFound();
  }
  const relatedFiles = await fetchFileMapping(parsedParams.sharedSchoolChatId);

  return (
    <div className="w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <SharedSchoolChatEditForm
          {...sharedSchoolChat}
          existingFiles={relatedFiles}
          isCreating={false}
        />
      </div>
    </div>
  );
}
