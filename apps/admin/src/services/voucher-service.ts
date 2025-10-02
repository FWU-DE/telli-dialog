'use server';
import { env } from '../consts/env';
import { type Voucher } from '../types/voucher';

const VOUCHERS_API_URL = "/api/v1/{federalStateId}/vouchers";
export async function fetchVouchers(federalStateId: string): Promise<Voucher[]> {
  const response = await fetch(env.BASE_URL_TELLI_DIALOG + VOUCHERS_API_URL.replace('{federalStateId}', federalStateId), {
    method: 'GET',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Gutscheine konnten nicht abgerufen werden: ${response.statusText}`);
  }
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
  const response = await fetch(env.BASE_URL_TELLI_DIALOG + VOUCHERS_API_URL.replace('{federalStateId}', federalStateId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
    },
    body: JSON.stringify({
      increaseAmount,
      durationMonths,
      createdBy,
      createReason,
      numberOfCodes,
    }),
  });
  if (!response.ok) {
    throw new Error(`Gutscheine konnten nicht erstellt werden: ${response.statusText}`);
  }
  const data = await response.json();
  return data as Voucher[];
}

export async function revokeVoucher(
  code: string,
  federalStateId: string,
  updatedBy: string,
  updateReason: string,
): Promise<void> {
  const response = await fetch(env.BASE_URL_TELLI_DIALOG + VOUCHERS_API_URL.replace('{federalStateId}', federalStateId), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
    },
    body: JSON.stringify({ code, revoked: true, updatedBy, updateReason }),
  });
  if (!response.ok) {
    throw new Error(`Gutschein konnte nicht widerrufen werden: ${response.statusText}`);
  }
  return;
}
