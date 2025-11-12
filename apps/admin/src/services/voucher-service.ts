'use server';
import { env } from '../consts/env';
import { type Voucher } from '../types/voucher';
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
  increaseAmount: number,
  durationMonths: number,
  createdBy: string,
  createReason: string,
  numberOfCodes: number,
): Promise<Voucher[]> {
  const response = await fetchFromDialog(
    env.telliDialogBaseUrl + apiRoutes.VOUCHERS_API_URL(federalStateId),
    {
      method: 'POST',
      body: JSON.stringify({
        increaseAmount,
        durationMonths,
        createdBy,
        createReason,
        numberOfCodes,
      }),
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
