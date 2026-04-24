import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import RedeemVoucherPage from './redeem-voucher-page';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { requireAuth } from '@/auth/requireAuth';

export default async function Page() {
  const { user, federalState } = await requireAuth();
  const userAndContext = {
    ...user,
    federalState,
    hasApiKeyAssigned: federalState.hasApiKeyAssigned,
  };

  return (
    <DefaultPageLayout>
      <CustomChatHeader userAndContext={userAndContext} />
      <RedeemVoucherPage />
    </DefaultPageLayout>
  );
}
