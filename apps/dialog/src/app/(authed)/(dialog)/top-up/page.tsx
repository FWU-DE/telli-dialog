import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import RedeemVoucherPage from './redeem-voucher-page';
import CustomChatHeader from '@/components/custom-chat/custom-chat-header';
import { requireAuth } from '@/auth/requireAuth';
import { buildLegacyUserAndContext } from '@/auth/types';

export default async function Page() {
  const { user, school, federalState } = await requireAuth();
  const userAndContext = buildLegacyUserAndContext(user, school, federalState);

  return (
    <DefaultPageLayout>
      <CustomChatHeader
        userAndContext={userAndContext}
        isNewUiDesignEnabled={federalState.featureToggles.isNewUiDesignEnabled}
      />
      <RedeemVoucherPage />
    </DefaultPageLayout>
  );
}
