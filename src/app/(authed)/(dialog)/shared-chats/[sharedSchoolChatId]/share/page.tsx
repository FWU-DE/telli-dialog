import NotFound from '@/app/not-found';
import { getUser } from '@/auth/utils';
import SidebarCloseIcon from '@/components/icons/sidebar-close';
import Footer from '@/components/navigation/footer';
import { dbGetSharedSchoolChatById } from '@/db/functions/shared-school-chat';
import { getBaseUrlByHeaders, getHostByHeaders } from '@/utils/host';
import { PageContext } from '@/utils/next/types';
import { awaitPageContext } from '@/utils/next/utils';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { z } from 'zod';
import CountDownTimer from '../../_components/count-down';
import { calculateTimeLeftBySharedChat } from '../utils';
import QRCode from './qr-code';
import TelliClipboardButton from '@/components/common/clipboard-button';

const pageContextSchema = z.object({
  params: z.object({
    sharedSchoolChatId: z.string(),
  }),
});

export default async function Page(context: PageContext) {
  const result = pageContextSchema.safeParse(await awaitPageContext(context));
  if (!result.success) return <NotFound />;

  const { params } = result.data;
  const user = await getUser();

  const sharedSchoolChat = await dbGetSharedSchoolChatById({
    userId: user.id,
    sharedChatId: params.sharedSchoolChatId,
  });

  if (!sharedSchoolChat || !sharedSchoolChat.inviteCode) {
    return <NotFound />;
  }

  const inviteCode = sharedSchoolChat.inviteCode;
  const formattedInviteCode = `${inviteCode.substring(0, 4)} ${inviteCode.substring(4, 8)}`;
  const shareUrl = `${await getBaseUrlByHeaders()}/ua/shared-chats/${sharedSchoolChat.id}/dialog?inviteCode=${inviteCode}`;
  const leftTime = calculateTimeLeftBySharedChat(sharedSchoolChat);
  const t = await getTranslations('shared-chats.share-page');

  return (
    <div className="w-full px-4 sm:px-8 overflow-auto flex flex-col h-full">
      <Link
        href={`/shared-chats/${sharedSchoolChat.id}`}
        className="flex gap-2 items-center text-primary w-full"
      >
        <SidebarCloseIcon className="w-4 h-4" />
        <span className="text-base font-normal hover:underline">{t('back-button')}</span>
      </Link>
      <div className="mx-auto mt-10 sm:mt-16 flex flex-col justify-center items-center text-center w-full">
        <h1 className="text-4xl sm:text-7xl font-medium mb-10 sm:mb-16">{t('join')}</h1>
        <CountDownTimer
          leftTime={Math.max(leftTime, 0)}
          totalTime={sharedSchoolChat.maxUsageTimeLimit ?? 0}
          stopWatchClassName="w-8 h-8"
        />
        <main className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] w-full gap-6 mt-6 sm:mt-8 mb-12 sm:mb-16">
          <section className="flex flex-col justify-between gap-4 items-center">
            <div className="flex flex-col items-center gap-4">
              <p className="text-2xl sm:text-3xl">{t('go-to')}</p>
              <Link href={await getBaseUrlByHeaders()} target="_blank">
                <p className="text-3xl sm:text-5xl text-primary font-bold">
                  {await getHostByHeaders()}
                </p>
              </Link>
            </div>
            <div className="flex flex-col items-center gap-4">
              <p className="text-2xl sm:text-3xl">{t('enter-code')}</p>
              <div className="flex items-center gap-2">
                <p id="join-code" className="text-3xl sm:text-5xl text-primary font-bold">
                  {formattedInviteCode}
                </p>
                <TelliClipboardButton text={formattedInviteCode} />
              </div>
            </div>
            <Link
              href={shareUrl}
              target="_blank"
              className={cn(buttonPrimaryClassName, 'mt-10 sm:mt-16')}
            >
              {t('open-chat')}
            </Link>
          </section>
          <div className="hidden md:block w-1 border-r-[1px]" />
          <section className="flex flex-col justify-between items-center gap-8 sm:gap-12">
            <h2 className="text-2xl sm:text-3xl text-center">{t('use-qr')}</h2>
            <QRCode id="qr-code" className="w-64 h-64 sm:w-[400px] sm:h-[400px]" value={shareUrl} />
          </section>
        </main>
      </div>
      <div className="flex-grow" />
      <hr className="w-full" />
      <Footer />
    </div>
  );
}
