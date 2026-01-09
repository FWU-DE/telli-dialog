import { getVouchersAction } from './actions';
import VoucherListView from './VoucherListView';

export const dynamic = 'force-dynamic';

export default async function VouchersByStatePage(
  props: PageProps<'/telli-dialog/federal-states/[federalStateId]/vouchers'>,
) {
  const { federalStateId } = await props.params;
  const vouchers = await getVouchersAction(federalStateId);

  return <VoucherListView vouchers={vouchers} federalStateId={federalStateId} />;
}
