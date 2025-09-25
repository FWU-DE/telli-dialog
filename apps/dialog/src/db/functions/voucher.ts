'use server';

import { and, eq, gt, sql, sum } from 'drizzle-orm';
import { db } from '..';
import { VoucherInsertModel, VoucherTable } from '../schema';

export async function dbGetVoucherPriceLimit(userId: string) {
  const [result] = await db
    .select({
      totalPriceLimit: sum(VoucherTable.increase_amount),
    })
    .from(VoucherTable)
    .where(
      and(
        eq(VoucherTable.status, 'used'),
        eq(VoucherTable.redeemedBy, userId),
        gt(sql`date_trunc('month', redeemedAt) + INTERVAL duration_months MONTH`, sql`now()`),
      ),
    );

  return result?.totalPriceLimit ?? 0;
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
