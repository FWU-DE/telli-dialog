import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import RedeemVoucherPage from './redeem-voucher-page';
import { requireAuth } from '@/auth/requireAuth';

export default async function Page() {
  await requireAuth();

  return (
    <DefaultPageLayout>
      <RedeemVoucherPage />
    </DefaultPageLayout>
  );
}
