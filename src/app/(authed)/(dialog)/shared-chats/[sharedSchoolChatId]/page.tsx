import { getUser } from '@/auth/utils';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import ProfileMenu from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { dbGetSharedSchoolChatById } from '@/db/functions/shared-school-chat';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import HeaderPortal from '../../header-portal';
import SharedSchoolChatEditForm from './shared-school-chat-edit-form';

const pageContextSchema = z.object({
  params: z.object({
    sharedSchoolChatId: z.string(),
  }),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) notFound();

  const { params } = result.data;
  const [user, t] = await Promise.all([getUser(), getTranslations('shared-chats')]);

  const sharedSchoolChat = await dbGetSharedSchoolChatById({
    userId: user.id,
    sharedChatId: params.sharedSchoolChatId,
  });

  if (!sharedSchoolChat) {
    return notFound();
  }

  return (
    <div className="w-full p-6 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-3xl mx-auto mt-4">
        <Link href="/shared-chats" className="flex gap-3 items-center text-primary">
          <ChevronLeftIcon />
          <span className="hover:underline">{t('form.all-dialogs')}</span>
        </Link>
        <h1 className="text-2xl mt-4 font-medium">{sharedSchoolChat.name}</h1>
        <SharedSchoolChatEditForm {...sharedSchoolChat} />
      </div>
    </div>
  );
}
