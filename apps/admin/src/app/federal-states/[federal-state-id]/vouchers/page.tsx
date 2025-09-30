import { fetchVouchers } from '../../../../services/voucher-service';
import { auth } from '../../../api/auth/[...nextauth]/auth';
import VoucherListView from './VoucherListView';

export default async function VouchersByStatePage({
  params,
}: {
  params: Promise<{ 'federal-state-id': string }>;
}) {
  const federalStateId = (await params)['federal-state-id'];
  const vouchers = await fetchVouchers(federalStateId);
  const session = await auth();

  return <VoucherListView vouchers={vouchers} username={session?.user?.name ?? undefined} />;
}
