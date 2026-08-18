import { getVouchersAction } from './actions';
import VoucherListView from './VoucherListView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function VouchersByStatePage(
  props: PageProps<'/ais-chat-app/federal-states/[federalStateId]/vouchers'>,
) {
  const { federalStateId } = await props.params;
  const vouchers = await getVouchersAction(federalStateId);

  return <VoucherListView vouchers={vouchers} federalStateId={federalStateId} />;
}
