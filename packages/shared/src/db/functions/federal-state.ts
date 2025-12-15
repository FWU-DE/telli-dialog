import { db } from '..';
import {
  FederalStateInsertModel,
  FederalStateSelectModel,
  federalStateTable,
  FederalStateUpdateModel,
} from '../schema';
import { eq } from 'drizzle-orm';
import { decrypt } from '../crypto';
import { env } from '../../env';
import { errorifyAsyncFn } from '../../utils/error';

export const dbGetFederalStateWithDecryptedApiKeyWithResult = errorifyAsyncFn(
  dbGetFederalStateWithDecryptedApiKey,
);
export async function dbGetFederalStateWithDecryptedApiKey({
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

  return { ...federalState, decryptedApiKey, trustedApiKeyId: federalState.apiKeyId };
}

export async function dbGetFederalStates(): Promise<FederalStateSelectModel[]> {
  return db.select().from(federalStateTable);
}

// TODO: We have two functions for getting federal state by id
export async function dbGetFederalState(id: string): Promise<FederalStateSelectModel> {
  const [federalState] = await db
    .select()
    .from(federalStateTable)
    .where(eq(federalStateTable.id, id));

  if (!federalState) {
    throw new Error(`Federal state with id ${id} not found`);
  }
  return federalState;
}

export const dbGetFederalStateByIdWithResult = errorifyAsyncFn(dbGetFederalStateById);
export async function dbGetFederalStateById(id: string | undefined) {
  if (id === undefined) {
    return undefined;
  }
  const [federalState] = await db
    .select()
    .from(federalStateTable)
    .where(eq(federalStateTable.id, id));

  return federalState;
}

export async function dbInsertFederalState(federalState: FederalStateInsertModel) {
  const [inserted] = await db.insert(federalStateTable).values(federalState).returning();

  return inserted;
}

export async function dbUpdateFederalState(federalState: FederalStateUpdateModel) {
  const [updated] = await db
    .update(federalStateTable)
    .set(federalState)
    .where(eq(federalStateTable.id, federalState.id))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update federal state with id ${federalState.id}`);
  }

  return updated;
}

export async function dbDeleteFederalState(id: string) {
  if (!id) {
    throw new Error('No federal state id given');
  }
  const [deleted] = await db
    .delete(federalStateTable)
    .where(eq(federalStateTable.id, id))
    .returning();
  return deleted;
}
