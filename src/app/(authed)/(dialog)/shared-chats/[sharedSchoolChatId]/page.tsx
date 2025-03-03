import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import HeaderPortal from '../../header-portal';
import ProfileMenu from '@/components/navigation/profile-menu';
import { getUser } from '@/auth/utils';
import Link from 'next/link';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import SharedSchoolChatEditForm from './shared-school-chat-edit-form';
import { z } from 'zod';
import { dbGetSharedSchoolChatById } from '@/db/functions/shared-school-chat';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

const pageContextSchema = z.object({
  params: z.object({
    sharedSchoolChatId: z.string(),
  }),
});

async function safeParse(context: { params: Promise<{ sharedSchoolChatId: string }> }) {
  const resolvedParams = await context.params;
  const parseResult = pageContextSchema.safeParse({ params: resolvedParams });

  if (parseResult.success) {
    return parseResult.data;
  }

  return null;
}

export default async function Page(context: { params: Promise<{ sharedSchoolChatId: string }> }) {
  const parsedContext = await safeParse(context);

  if (!parsedContext) {
    return notFound();
  }

  const { params } = parsedContext;
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
