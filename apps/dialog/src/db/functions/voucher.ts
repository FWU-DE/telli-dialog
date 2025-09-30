'use server';

import { and, eq, gt, sql, sum } from 'drizzle-orm';
import { db } from '..';
import { VoucherInsertModel, VoucherTable } from '../schema';

export async function dbGetVoucherPriceLimit(userId: string) {
  const [result] = await db
    .select({
      totalPriceLimit: sum(VoucherTable.increaseAmount),
    })
    .from(VoucherTable)
    .where(
      and(
        eq(VoucherTable.status, 'created'),
        eq(VoucherTable.redeemedBy, userId),
        gt(
          sql`date_trunc('month', redeemed_at) + make_interval(months:=duration_months)`,
          sql`now()`,
        ),
      ),
    );

  return Number(result?.totalPriceLimit ?? 0);
}

export async function dbInsertVouchers(vouchers: VoucherInsertModel[]) {
  return await db.insert(VoucherTable).values(vouchers).returning();
}

export async function dbGetVouchersByFederalStateId(federalStateId: string) {
  return await db
    .select()
    .from(VoucherTable)
    .where(and(eq(VoucherTable.federalStateId, federalStateId)));
}

export async function dbGetVoucherByCode(code: string) {
  const [result] = await db.select().from(VoucherTable).where(eq(VoucherTable.code, code)).limit(1);
  return result;
}

export async function dbUpdateVoucher(voucher: Partial<VoucherInsertModel>) {
  if (!voucher.id) throw new Error('Voucher ID is required for update');
  const [result] = await db
    .update(VoucherTable)
    .set(voucher)
    .where(eq(VoucherTable.id, voucher.id))
    .returning();
  return result;
}

export async function dbRedeemVoucher(voucher: string, userId: string) {
  const [result] = await db
    .update(VoucherTable)
    .set({ status: 'redeemed', redeemedBy: userId, redeemedAt: new Date() })
    .where(eq(VoucherTable.code, voucher))
    .returning();
  return result;
}
