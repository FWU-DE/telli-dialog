import CollapseSidebar from '@/components/common/collapse-sidebar';
import CopyToClipboardButton from '@/components/common/clipboard-button';
import SidebarCloseIcon from '@/components/icons/sidebar-close';
import Footer from '@/components/navigation/footer';
import { getBaseUrlByHeaders, getHostByHeaders } from '@/utils/host';
import CountDownTimer from '@/app/(authed)/(chat-bot)/learning-scenarios/_components/count-down';
import { Button } from '@ui/components/button';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import CustomChatHeader from './custom-chat-header';

type CustomChatSharePageProps = {
  backHref: string;
  customChatName: string;
  inviteCode: string;
  leftTimeInSeconds: number;
  relativeShareUrl: string;
  totalTimeInSeconds: number;
  customChatVariant: 'character' | 'learning-scenario';
};

export default async function CustomChatSharePage({
  backHref,
  customChatName,
  inviteCode,
  leftTimeInSeconds,
  relativeShareUrl,
  totalTimeInSeconds,
  customChatVariant,
}: CustomChatSharePageProps) {
  const t = await getTranslations('custom-chat.share-page');
  const baseUrl = await getBaseUrlByHeaders();
  const host = await getHostByHeaders();
  const absoluteShareUrl = new URL(relativeShareUrl, baseUrl).href;
  const formattedInviteCode = `${inviteCode.substring(0, 4)} ${inviteCode.substring(4, 8)}`;

  return (
    <div className="w-full px-4 sm:px-8 overflow-auto flex flex-col h-full">
      <CollapseSidebar />
      <CustomChatHeader />
      <Link href={backHref} className="flex gap-2 items-center text-primary w-full">
        <SidebarCloseIcon className="w-4 h-4" />
        <span className="text-base font-normal hover:underline">
          {t(`${customChatVariant}.back-button`)}
        </span>
      </Link>
      <div className="mx-auto mt-2 flex flex-col justify-center items-center text-center w-full">
        <p className="text-2xl sm:text-3xl mb-6">{t(`${customChatVariant}.sub-header`)}</p>
        <h1 className="text-4xl sm:text-5xl font-medium mb-10">{customChatName}</h1>
        <CountDownTimer
          leftTimeInSeconds={leftTimeInSeconds}
          totalTimeInSeconds={totalTimeInSeconds}
          stopWatchClassName="w-8 h-8"
        />
        <main className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] w-full gap-6 mt-6 sm:mt-8 mb-12 sm:mb-16">
          <section className="flex flex-col justify-between gap-4 items-center">
            <div className="flex flex-col items-center gap-4">
              <p className="text-2xl sm:text-3xl">{t(`go-to`)}</p>
              <Link href={baseUrl} target="_blank" rel="noopener noreferrer">
                <p className="text-3xl sm:text-5xl text-primary font-bold">{host}</p>
              </Link>
            </div>
            <div className="flex flex-col items-center gap-4">
              <p className="text-2xl sm:text-3xl">{t('enter-code')}</p>
              <div className="flex items-center gap-2">
                <p data-testid="join-code" className="text-3xl sm:text-5xl text-primary font-bold">
                  {formattedInviteCode}
                </p>
                <CopyToClipboardButton text={formattedInviteCode} className="size-7 sm:size-9" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 sm:mt-auto">
              <Button asChild>
                <Link href={absoluteShareUrl} target="_blank" rel="noopener noreferrer">
                  {t('open-chat')}
                </Link>
              </Button>
              <CopyToClipboardButton
                text={absoluteShareUrl}
                variant="outline"
                size="default"
                defaultIcons={false}
                aria-label={t('copy-link')}
              >
                {t('copy-link')}
              </CopyToClipboardButton>
            </div>
          </section>
          <div className="hidden sm:block w-1 border-r" />
          <section className="flex flex-col justify-between items-center gap-8">
            <h2 className="text-2xl sm:text-3xl text-center">{t('use-qr')}</h2>
            <QRCodeSVG
              data-testid="qr-code"
              className="w-full h-full max-w-64 sm:max-w-80 md:max-w-96 max-h-64 sm:max-h-80 md:max-h-96"
              value={absoluteShareUrl}
            />
          </section>
        </main>
      </div>
      <div className="grow" />
      <hr className="w-full" />
      <Footer />
    </div>
  );
}
