import { fetchVouchers } from '../../../../../services/voucher-service';
import { auth } from '../../../../api/auth/[...nextauth]/auth';
import VoucherListView from './VoucherListView';

export default async function VouchersByStatePage({
  params,
}: {
  params: Promise<{ federalStateId: string }>;
}) {
  const federalStateId = (await params).federalStateId;
  const vouchers = await fetchVouchers(federalStateId);
  const session = await auth();

  return (
    <VoucherListView
      vouchers={vouchers}
      federalStateId={federalStateId}
      username={session?.user?.name ?? undefined}
    />
  );
}
