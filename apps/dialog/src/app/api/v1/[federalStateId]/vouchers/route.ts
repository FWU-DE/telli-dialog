import { getVouchers, createVouchers, revokeVoucher } from '@shared/vouchers/voucher-service';
import { createVoucherSchema, revokeVoucherSchema } from '@shared/vouchers/voucher';
import { NotFoundError } from '@shared/error';
import { VoucherAlreadyRedeemedError } from '@shared/error/voucher-errors';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ federalStateId: string }> },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  try {
    const codes = await getVouchers((await params).federalStateId);
    return NextResponse.json(codes, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
  }
}

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
  const parseResult = createVoucherSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
  }

  try {
    const createdCodes = await createVouchers((await params).federalStateId, parseResult.data);
    return NextResponse.json(createdCodes, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create vouchers' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ federalStateId: string }> },
) {
  const [error] = validateApiKeyByHeadersWithResult(request.headers);
  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  const body = await request.json();
  const parseResult = revokeVoucherSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.message }, { status: 400 });
  }
  const parseData = parseResult.data;

  try {
    // Schema validation ensures parseData.revoked is true
    await revokeVoucher(
      parseData.code,
      (await params).federalStateId,
      parseData.updatedBy,
      parseData.updateReason,
    );
    return NextResponse.json({ message: 'Voucher revoked successfully' }, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof VoucherAlreadyRedeemedError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update voucher' }, { status: 500 });
  }
}
