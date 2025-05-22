import { db } from '..';
import { FederalStateInsertModel, federalStateTable } from '../schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '../crypto';
import { env } from '@/env';
import { errorifyAsyncFn } from '@/utils/error';

export const dbGetApiKeyByFederalStateIdWithResult = errorifyAsyncFn(dbGetApiKeyByFederalStateId);
export const dbGetFederalStateByIdWithResult = errorifyAsyncFn(dbGetFederalStateById);
export async function dbGetApiKeyByFederalStateId({
  federalStateId,
}: {
  federalStateId: string | undefined;
}) {
  if (federalStateId === undefined) {
    throw Error('No federal state id given');
  }

  const [federalState] = await db
    .select()
    .from(federalStateTable)
    .where(eq(federalStateTable.id, federalStateId));

  if (federalState === undefined) {
    throw Error(`Could not find federal state with id ${federalStateId}`);
  }

  if (federalState.encryptedApiKey === null) {
    throw Error(`Federal state ${federalState.id} has no api key attached`);
  }

  const decryptedApiKey = decrypt({
    data: federalState.encryptedApiKey,
    plainEncryptionKey: env.encryptionKey,
  });

  return { ...federalState, decryptedApiKey };
}

export async function dbGetAllFederalStates() {
  return await db.select().from(federalStateTable);
}

export async function dbGetFederalStateById(id: string | undefined) {
  if (id === undefined) {
    return undefined;
  }
  const [federalState] = await db
    .select()
    .from(federalStateTable)
    .where(eq(federalStateTable.id, id));

  if (federalState === undefined) {
    throw Error(`Could not find federal state with id ${id}`);
  }

  return federalState;
}

export async function dbUpsertFederalState(federalState: FederalStateInsertModel) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, ..._federalState } = federalState;
  const [upserted] = await db
    .insert(federalStateTable)
    .values(_federalState)
    .onConflictDoUpdate({
      target: federalStateTable.id,
      set: {
        encryptedApiKey: _federalState.encryptedApiKey,
        studentPriceLimit: _federalState.studentPriceLimit,
        teacherPriceLimit: _federalState.teacherPriceLimit,
      },
    })
    .returning();

  return upserted;
}
