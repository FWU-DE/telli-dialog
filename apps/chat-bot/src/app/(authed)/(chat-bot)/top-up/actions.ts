'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { redeemVoucher } from '@shared/vouchers/voucher-service';

export async function redeemVoucherAction(voucherCode: string) {
  const { user, federalState } = await requireAuth();

  return runServerAction(redeemVoucher)({
    voucherCode,
    userId: user.id,
    federalStateId: federalState.id,
  });
}
