import { getUser } from '@/auth/utils';
import SharedSchoolChatCreateForm from './shared-school-chat-form';
import HeaderPortal from '../../header-portal';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import ProfileMenu from '@/components/navigation/profile-menu';
import Link from 'next/link';
import ChevronLeftIcon from '@/components/icons/chevron-left';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const user = await getUser();
  const t = await getTranslations('Chat.shared-chats.form');

  return (
    <div className="min-w-full p-4 overflow-auto">
      <HeaderPortal>
        <ToggleSidebarButton />
        <div className="flex-grow"></div>
        <ProfileMenu {...user} />
      </HeaderPortal>
      <div className="max-w-4xl mx-auto mt-4">
        <Link href="/shared-chats" className="flex gap-3 items-center text-primary">
          <ChevronLeftIcon />
          <span className="hover:underline">{t('all-dialogs')}</span>
        </Link>
        <h1 className="text-2xl mt-4 font-medium">{t('title')}</h1>
        <SharedSchoolChatCreateForm />
      </div>
    </div>
  );
}
