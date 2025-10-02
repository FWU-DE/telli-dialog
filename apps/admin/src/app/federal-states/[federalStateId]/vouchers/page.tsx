import { fetchVouchers } from '../../../../services/voucher-service';
import { auth } from '../../../api/auth/[...nextauth]/auth';
import VoucherListView from './VoucherListView';

export const VOUCHERS_BY_STATE_ROUTE = '/federal-states/{federalStateId}/vouchers';
export default async function VouchersByStatePage({
  params,
}: {
  params: Promise<{ federalStateId: string }>;
}) {
  const federalStateId = (await params).federalStateId;
  const vouchers = await fetchVouchers(federalStateId);
  const session = await auth();

  return <VoucherListView vouchers={vouchers} username={session?.user?.name ?? undefined} />;
}
