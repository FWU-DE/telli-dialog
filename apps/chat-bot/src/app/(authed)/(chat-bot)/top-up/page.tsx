import { DefaultPageLayout } from '@/components/layout/default-page-layout';
import RedeemVoucherPage from './redeem-voucher-page';
import { requireAuth } from '@/auth/requireAuth';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { Spinner } from '@ui/components/spinner';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('top-up.page-titles');
  return {
    title: t('redeem'),
  };
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center p-8">
          <Spinner className="size-8" />
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}

async function PageContent() {
  await requireAuth();

  return (
    <DefaultPageLayout>
      <RedeemVoucherPage />
    </DefaultPageLayout>
  );
}
