'use server';
import {
  FederalStateSelectModel,
  FederalStateUpdateModel,
  federalStateUpdateSchema,
} from '@shared/db/schema';
import {
  dbGetFederalState,
  dbGetFederalStates,
  dbUpdateFederalState,
} from '@shared/db/functions/federal-state';
import { FederalStateModel } from '@shared/types/federal-state';
import { encrypt } from '@shared/db/crypto';
import { env } from '@shared/env';

export async function getFederalStates(): Promise<FederalStateModel[]> {
  const federalStates = await dbGetFederalStates();
  return federalStates.map((federalState) => {
    return transformToModel(federalState);
  });
}

export async function getFederalStateById(federalStateId: string): Promise<FederalStateModel> {
  const federalState = await dbGetFederalState(federalStateId);
  return transformToModel(federalState);
}

const updateSchema = federalStateUpdateSchema.omit({
  createdAt: true,
  encryptedApiKey: true,
});

export async function updateFederalState(
  federalState: Omit<FederalStateUpdateModel, 'encryptedApiKey' | 'createdAt'>,
): Promise<FederalStateModel> {
  const values = updateSchema.parse(federalState);
  const updated = await dbUpdateFederalState(values);
  return transformToModel(updated);
}

export async function updateApiKey(
  federalStateId: string,
  decryptedApiKey: string,
): Promise<FederalStateModel> {
  const apiKey = encrypt({
    text: decryptedApiKey,
    plainEncryptionKey: env.encryptionKey,
  });

  const updated = await dbUpdateFederalState({
    id: federalStateId,
    encryptedApiKey: apiKey,
  });

  if (!updated) {
    throw new Error(`Failed to update federal state with id ${federalStateId}`);
  }
  return transformToModel(updated);
}

function transformToModel(federalState: FederalStateSelectModel): FederalStateModel {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { encryptedApiKey, ...federalStateWithoutApiKey } = federalState;

  return {
    ...federalStateWithoutApiKey,
    hasApiKeyAssigned: !!federalState.encryptedApiKey,
  };
}
