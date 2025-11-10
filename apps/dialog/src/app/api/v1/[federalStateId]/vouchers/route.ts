import {
  dbGetVoucherByCode,
  dbGetVouchersByFederalStateId,
  dbInsertVouchers,
  dbUpdateVoucher,
} from '@shared/db/functions/voucher';
import { VoucherInsertModel, VoucherTable, VoucherUpdateModel } from '@shared/db/schema';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';
import { createInsertSchema } from 'drizzle-zod';
import { NextRequest, NextResponse } from 'next/server';
import z from 'zod/v4';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ federalStateId: string }> },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const codes = await dbGetVouchersByFederalStateId((await params).federalStateId);
  return NextResponse.json(codes, { status: 200 });
}

const codePostSchema = createInsertSchema(VoucherTable)
  .pick({
    increaseAmount: true,
    durationMonths: true,
    createdBy: true,
    createReason: true,
  })
  .extend({
    increaseAmount: z.number().min(1).max(20_000),
    durationMonths: z.number().min(1).max(12).default(3),
    createReason: z.string().min(1).max(500),
    numberOfCodes: z.number().min(1).default(1),
  });

// Creates Multiple codes at once
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ federalStateId: string }> },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const body = await request.json();
  const parseResult = codePostSchema.safeParse(body);
  if (parseResult.error) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
  }
  const parseData = parseResult.data;

  const valid_until = new Date();
  valid_until.setFullYear(valid_until.getFullYear() + 2);

  const federalStateId = (await params).federalStateId;

  const codesToCreate: VoucherInsertModel[] = [];
  for (let i = 0; i < parseData.numberOfCodes; i++) {
    codesToCreate.push({
      code: crypto.randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase(),
      increaseAmount: parseData.increaseAmount,
      durationMonths: parseData.durationMonths,
      validUntil: valid_until,
      federalStateId: federalStateId,
      createdBy: parseData.createdBy,
      createReason: parseData.createReason,
    });
  }

  const createdCodes = await dbInsertVouchers(codesToCreate);
  return NextResponse.json(createdCodes, { status: 201 });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ federalStateId: string }> },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const patchSchema = z.object({
    code: z.string().length(16),
    revoked: z.boolean().optional(),
    updatedBy: z.string().min(1).max(100),
    updateReason: z.string().min(1).max(500),
  });

  const body = await request.json();
  const parseResult = patchSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
  }
  const parseData = parseResult.data;

  const voucher = await dbGetVoucherByCode(parseData.code);
  if (!voucher || voucher.federalStateId !== (await params).federalStateId) {
    return NextResponse.json({ error: 'Voucher not found' }, { status: 404 });
  }
  if (voucher.status === 'redeemed') {
    return NextResponse.json(
      { error: 'Voucher already redeemed and cannot be modified' },
      { status: 400 },
    );
  }

  const updatedFields: VoucherUpdateModel = {
    id: voucher.id,
    updatedBy: parseData.updatedBy,
    updateReason: parseData.updateReason,
    updatedAt: new Date(),
    status: parseData.revoked ? 'revoked' : 'created',
  };
  const updatedVoucher = await dbUpdateVoucher(updatedFields);
  return NextResponse.json(updatedVoucher, { status: 200 });
}
