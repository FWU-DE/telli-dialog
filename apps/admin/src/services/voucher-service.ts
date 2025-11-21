import { env } from '../consts/env';
import { type Voucher, type CreateVoucherRequest } from '../types/voucher';
import { fetchFromDialog } from './fetch';

const apiRoutes = {
  VOUCHERS_API_URL: (federalStateId: string) => `/api/v1/${federalStateId}/vouchers`,
};

export async function fetchVouchers(federalStateId: string): Promise<Voucher[]> {
  const response = await fetchFromDialog(
    env.telliDialogBaseUrl + apiRoutes.VOUCHERS_API_URL(federalStateId),
  );

  const data = await response.json();
  return data as Voucher[];
}

export async function createVouchers(
  federalStateId: string,
  voucherData: CreateVoucherRequest,
): Promise<Voucher[]> {
  const response = await fetchFromDialog(
    env.telliDialogBaseUrl + apiRoutes.VOUCHERS_API_URL(federalStateId),
    {
      method: 'POST',
      body: JSON.stringify(voucherData),
    },
  );

  const data = await response.json();
  return data as Voucher[];
}

export async function revokeVoucher(
  code: string,
  federalStateId: string,
  updatedBy: string,
  updateReason: string,
): Promise<void> {
  await fetchFromDialog(env.telliDialogBaseUrl + apiRoutes.VOUCHERS_API_URL(federalStateId), {
    method: 'PATCH',
    body: JSON.stringify({ code, revoked: true, updatedBy, updateReason }),
  });

  return;
}
