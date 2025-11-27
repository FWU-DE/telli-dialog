import { fetchVouchersAction } from './actions';
import { auth } from '../../../../api/auth/[...nextauth]/auth';
import VoucherListView from './VoucherListView';

export const dynamic = 'force-dynamic';

export default async function VouchersByStatePage(
  props: PageProps<'/telli-dialog/federal-states/[federalStateId]/vouchers'>,
) {
  const { federalStateId } = await props.params;
  const vouchers = await fetchVouchersAction(federalStateId);
  const session = await auth();

  return (
    <VoucherListView
      vouchers={vouchers}
      federalStateId={federalStateId}
      username={session?.user?.name ?? undefined}
    />
  );
}
