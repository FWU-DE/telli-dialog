'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import {
  fetchVouchers,
  createVouchers,
  revokeVoucher,
} from '@telli/shared/vouchers/voucher-service';
import { type CreateVoucherModel } from '@telli/shared/vouchers/voucher';

export async function fetchVouchersAction(federalStateId: string) {
  await requireAdminAuth();

  return fetchVouchers(federalStateId);
}

export async function createVouchersAction(
  federalStateId: string,
  voucherData: CreateVoucherModel,
) {
  await requireAdminAuth();

  return createVouchers(federalStateId, voucherData);
}

export async function revokeVoucherAction(
  code: string,
  federalStateId: string,
  updatedBy: string,
  updateReason: string,
) {
  await requireAdminAuth();

  return revokeVoucher(code, federalStateId, updatedBy, updateReason);
}
