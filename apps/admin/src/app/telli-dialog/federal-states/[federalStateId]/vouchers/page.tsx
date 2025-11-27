import { getVouchersAction } from './actions';
import { auth } from '../../../../api/auth/[...nextauth]/auth';
import VoucherListView from './VoucherListView';

export const dynamic = 'force-dynamic';

export default async function VouchersByStatePage({
  params,
}: {
  params: Promise<{ federalStateId: string }>;
}) {
  const federalStateId = (await params).federalStateId;
  const vouchers = await getVouchersAction(federalStateId);
  const session = await auth();

  return (
    <VoucherListView
      vouchers={vouchers}
      federalStateId={federalStateId}
      username={session?.user?.name ?? undefined}
    />
  );
}
