import SidebarCloseIcon from '@/components/icons/sidebar-close';
import Footer from '@/components/navigation/footer';
import { getBaseUrlByHeaders, getHostByHeaders } from '@/utils/host';
import { Button } from '@ui/components/Button';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import CountDownTimer from '../../../_components/count-down';
import { QRCodeSVG } from 'qrcode.react';
import TelliClipboardButton from '@/components/common/clipboard-button';
import { getSharedLearningScenario } from '@shared/learning-scenarios/learning-scenario-service';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { requireAuth } from '@/auth/requireAuth';
import { handleErrorInServerComponent } from '@/error/handle-error-in-server-component';
import { notFound } from 'next/navigation';
import CollapseSidebar from '@/components/common/collapse-sidebar';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { buildLegacyUserAndContext } from '@/auth/types';

export default async function Page(
  props: PageProps<'/learning-scenarios/editor/[learningScenarioId]/share'>,
) {
  const { learningScenarioId } = await props.params;
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  const learningScenario = await getSharedLearningScenario({
    learningScenarioId: learningScenarioId,
    userId: user.id,
  }).catch(handleErrorInServerComponent);

  if (!learningScenario.inviteCode) {
    notFound();
  }

  const inviteCode = learningScenario.inviteCode;
  const formattedInviteCode = `${inviteCode.substring(0, 4)} ${inviteCode.substring(4, 8)}`;
  const shareUrl = `${await getBaseUrlByHeaders()}/ua/learning-scenarios/${learningScenario.id}/dialog?inviteCode=${inviteCode}`;
  const leftTime = calculateTimeLeft(learningScenario);
  const t = await getTranslations('learning-scenarios.share-page');

  return (
    <div className="w-full px-4 sm:px-8 overflow-auto flex flex-col h-full">
      <CollapseSidebar />
      <CustomChatHeader userAndContext={userAndContext} />
      <Link
        href={`/learning-scenarios/editor/${learningScenario.id}`}
        className="flex gap-2 items-center text-primary w-full"
      >
        <SidebarCloseIcon className="w-4 h-4" />
        <span className="text-base font-normal hover:underline">{t('back-button')}</span>
      </Link>
      <div className="mx-auto mt-10 sm:mt-16 flex flex-col justify-center items-center text-center w-full">
        <h1 className="text-4xl sm:text-7xl font-medium mb-10 sm:mb-16">{t('join')}</h1>
        <CountDownTimer
          leftTime={Math.max(leftTime, 0)}
          totalTime={learningScenario.maxUsageTimeLimit}
          stopWatchClassName="w-8 h-8"
        />
        <main className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] w-full gap-6 mt-6 sm:mt-8 mb-12 sm:mb-16">
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
                <TelliClipboardButton
                  text={formattedInviteCode}
                  className="w-7 h-7 sm:w-9 sm:h-9"
                />
              </div>
            </div>
            <Button asChild className="mt-10 sm:mt-16">
              <Link href={shareUrl} target="_blank">
                {t('open-chat')}
              </Link>
            </Button>
          </section>
          <div className="hidden sm:block w-1 border-r" />
          <section className="flex flex-col justify-between items-center gap-8 sm:gap-12">
            <h2 className="text-2xl sm:text-3xl text-center">{t('use-qr')}</h2>
            <QRCodeSVG id="qr-code" className="w-64 h-64 sm:w-100 sm:h-100" value={shareUrl} />
          </section>
        </main>
      </div>
      <div className="grow" />
      <hr className="w-full" />
      <Footer />
    </div>
  );
}
