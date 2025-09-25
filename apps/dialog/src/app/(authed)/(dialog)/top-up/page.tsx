import { getUser } from '@/auth/utils';
import RedeemVoucherPage from './redeem-voucher-page';

export default async function Page() {
  const user = await getUser();
  return (
    <main className="max-w-3xl m-auto flex flex-col gap-8">
      <RedeemVoucherPage user={user} />
    </main>
  );
}
