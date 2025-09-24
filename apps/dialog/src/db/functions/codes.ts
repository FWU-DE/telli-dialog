'use server';

import { and, eq, gt, sql, sum } from 'drizzle-orm';
import { db } from '..';
import { CodeInsertModel, CodeTable } from '../schema';

export async function dbGetCodePriceLimit(userId: string) {
  const [result] = await db
    .select({
      totalPriceLimit: sum(CodeTable.increase_amount),
    })
    .from(CodeTable)
    .where(
      and(
        eq(CodeTable.status, 'used'),
        eq(CodeTable.redeemedBy, userId),
        gt(sql`date_trunc('month', redeemedAt) + INTERVAL duration_months MONTH`, sql`now()`),
      ),
    );

  return result?.totalPriceLimit ?? 0;
}

export async function dbInsertCodes(codes: CodeInsertModel[]) {
  const inserted = await db.insert(CodeTable).values(codes).returning();
  return inserted;
}

export async function dbGetCodesByFederalStateId(federalStateId: string) {
  const codes = await db
    .select()
    .from(CodeTable)
    .where(and(eq(CodeTable.federalStateId, federalStateId)));
  return codes;
}
