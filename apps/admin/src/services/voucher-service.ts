import { env } from '../consts/env';
import { type Voucher } from '../types/voucher';


export async function fetchVouchers(federalStateId: string): Promise<Voucher[]> {
    const url = env.BASE_URL_TELLI_DIALOG + `/api/v1/${federalStateId}/vouchers`
  const response = await fetch(env.BASE_URL_TELLI_DIALOG + `/api/v1/${federalStateId}/vouchers`, {
    method: 'GET',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
    },
  });
    if (!response.ok) {
    throw new Error(`Failed to fetch vouchers: ${response.statusText}`);
    }
    const data = await response.json();
    return data as Voucher[];
}

export async function createVouchers(federalStateId: string, increaseAmount: number, durationMonths: number, createdBy: string, createReason: string, numberOfCodes: number): Promise<Voucher[]> {
    const response = await fetch(env.BASE_URL_TELLI_DIALOG + `/api/v1/${federalStateId}/vouchers`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
        },
        body: JSON.stringify({ increaseAmount, durationMonths, createdBy, createReason, numberOfCodes }),
    });
    if (!response.ok) {
        throw new Error(`Failed to create vouchers: ${response.statusText}`);
    }
    const data = await response.json();
    return data.codes as Voucher[];
}

export async function revokeVoucher(code: string, federalStateId: string, updatedBy: string, updateReason: string): Promise<void> {
    const response = await fetch(env.BASE_URL_TELLI_DIALOG + `/api/v1/${federalStateId}/vouchers`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
        },
        body: JSON.stringify({ code, revoked: true, updatedBy, updateReason }),
    });
    if (!response.ok) {
        throw new Error(`Failed to revoke voucher: ${response.statusText}`);
    }
    return;
}