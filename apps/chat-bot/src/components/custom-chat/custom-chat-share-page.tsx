import { getBaseUrlByHeaders, getHostByHeaders } from '@/utils/host';
import { getTranslations } from 'next-intl/server';
import CustomChatSharePageContent from './custom-chat-share-page-content';

type CustomChatSharePageProps = {
  backHref: string;
  customChatName: string;
  inviteCode: string;
  leftTimeInSeconds: number;
  relativeShareUrl: string;
  totalTimeInSeconds: number;
  customChatVariant: 'character' | 'learning-scenario';
  expiredAt: Date | null;
  manuallyStoppedAt: Date | null;
  entityId: string;
};

export default async function CustomChatSharePage({
  backHref,
  customChatName,
  inviteCode,
  relativeShareUrl,
  totalTimeInSeconds,
  customChatVariant,
  expiredAt,
  manuallyStoppedAt,
  entityId,
}: CustomChatSharePageProps) {
  const t = await getTranslations('custom-chat.share-page');
  const baseUrl = await getBaseUrlByHeaders();
  const host = await getHostByHeaders();
  const absoluteShareUrl = new URL(relativeShareUrl, baseUrl).href;

  return (
    <CustomChatSharePageContent
      backHref={backHref}
      customChatName={customChatName}
      inviteCode={inviteCode}
      totalTimeInSeconds={totalTimeInSeconds}
      absoluteShareUrl={absoluteShareUrl}
      host={host}
      baseUrl={baseUrl}
      tGoTo={t('go-to')}
      tEnterCode={t('enter-code')}
      tOpenChat={t('open-chat')}
      tCopyLink={t('copy-link')}
      tUseQr={t('use-qr')}
      tBackButton={t(`${customChatVariant}.back-button`)}
      tSubHeader={t(`${customChatVariant}.sub-header`)}
      customChatVariant={customChatVariant}
      entityId={entityId}
      expiredAt={expiredAt}
      manuallyStoppedAt={manuallyStoppedAt}
    />
  );
}
