'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getVouchers, createVouchers, revokeVoucher } from '@telli/shared/vouchers/voucher-service';
import { type CreateVoucherParams } from '@telli/shared/vouchers/voucher';

export async function getVouchersAction(federalStateId: string) {
  await requireAdminAuth();

  return getVouchers(federalStateId);
}

export async function createVouchersAction(
  federalStateId: string,
  voucherData: Omit<CreateVoucherParams, 'createdBy'>,
) {
  const session = await requireAdminAuth();

  return createVouchers(federalStateId, {
    ...voucherData,
    createdBy: session.user.name,
  });
}

export async function revokeVoucherAction(
  code: string,
  federalStateId: string,
  updateReason: string,
) {
  const session = await requireAdminAuth();

  return revokeVoucher(code, federalStateId, session.user.name, updateReason);
}
