import { 
  type VoucherModel, 
  type CreateVoucherModel,
  createVoucherSchema,
  patchSchema,
  voucherSelectSchema,
} from './voucher';
import {
  dbGetVoucherByCode,
  dbGetVouchersByFederalStateId,
  dbInsertVouchers,
  dbUpdateVoucher,
} from '../db/functions/voucher';
import { VoucherInsertModel, VoucherUpdateModel } from '@shared/db/schema';

export async function fetchVouchers(federalStateId: string): Promise<VoucherModel[]> {
  const vouchers = await dbGetVouchersByFederalStateId(federalStateId);
  return voucherSelectSchema.array().parse(vouchers);
}

export async function createVouchers(
  federalStateId: string,
  voucherData: CreateVoucherModel,
): Promise<VoucherModel[]> {
  // Validate input using zod schema
  const validatedData = createVoucherSchema.parse(voucherData);

  const valid_until = new Date();
  valid_until.setFullYear(valid_until.getFullYear() + 2);

  const codesToCreate: VoucherInsertModel[] = [];
  for (let i = 0; i < validatedData.numberOfCodes; i++) {
    codesToCreate.push({
      code: crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase(),
      increaseAmount: validatedData.increaseAmount,
      durationMonths: validatedData.durationMonths,
      validUntil: valid_until,
      federalStateId: federalStateId,
      createdBy: validatedData.createdBy,
      createReason: validatedData.createReason,
      status: 'created' as const,
      updateReason: '',
    });
  }

  const createdCodes = await dbInsertVouchers(codesToCreate);
  return voucherSelectSchema.array().parse(createdCodes);
}

export async function revokeVoucher(
  code: string,
  federalStateId: string,
  updatedBy: string,
  updateReason: string,
): Promise<void> {
  // Validate input using zod schema
  const validatedInput = patchSchema.parse({
    code,
    updatedBy,
    updateReason,
    revoked: true,
  });

  const voucher = await dbGetVoucherByCode(validatedInput.code);
  if (!voucher || voucher.federalStateId !== federalStateId) {
    throw new Error('Voucher not found');
  }
  if (voucher.status === 'redeemed') {
    throw new Error('Voucher already redeemed and cannot be modified');
  }

  const updatedFields: VoucherUpdateModel = {
    id: voucher.id,
    updatedBy: validatedInput.updatedBy,
    updateReason: validatedInput.updateReason,
    updatedAt: new Date(),
    status: 'revoked' as const,
  };
  
  await dbUpdateVoucher(updatedFields);
}
