import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import RedeemVoucherPage from './redeem-voucher-page';
import { requireAuth } from '@/auth/requireAuth';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('top-up.page-titles');
  return {
    title: t('redeem'),
  };
}

export default async function Page() {
  await requireAuth();

  return (
    <DefaultPageLayout>
      <RedeemVoucherPage />
    </DefaultPageLayout>
  );
}
