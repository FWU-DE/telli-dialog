import { getVouchersAction } from './actions';
import VoucherListView from './VoucherListView';

export default async function VouchersByStatePage(
  props: PageProps<'/ais-chat-app/federal-states/[federalStateId]/vouchers'>,
) {
  const { federalStateId } = await props.params;
  const vouchers = await getVouchersAction(federalStateId);

  return <VoucherListView vouchers={vouchers} federalStateId={federalStateId} />;
}
