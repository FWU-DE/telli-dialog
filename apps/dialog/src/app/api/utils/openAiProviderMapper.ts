import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@shared/db/functions/federal-state';
import { dbGetModelByIdAndFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import { errorifyAsyncFn } from '@shared/utils/error';
import { env } from 'process';
import { createTelliConfiguration } from '../chat/custom-model-config';
import { getDefaultModelByFederalStateId } from './default-model';

export const getModelAndProviderWithResult = errorifyAsyncFn(getModelAndProvider);

async function getModelAndProvider({
  federalStateId,
  modelId,
}: {
  federalStateId: string;
  modelId: string;
  /* eslint-disable  @typescript-eslint/no-explicit-any */
}): Promise<{ telliProvider: any; definedModel: LlmModel }> {
  const [error, federalStateObject] = await dbGetFederalStateWithDecryptedApiKeyWithResult({
    federalStateId,
  });

  if (error !== null) {
    throw Error(error.message);
  }

  let definedModel = await dbGetModelByIdAndFederalStateId({ modelId, federalStateId });

  if (definedModel === undefined) {
    definedModel = await getDefaultModelByFederalStateId(federalStateId);

    if (definedModel === undefined) {
      throw new Error(`Could not find default model for federal state with id ${federalStateId}`);
    }
  }

  const telliConfiguration = createTelliConfiguration({
    apiKey: federalStateObject.decryptedApiKey,
    baseUrl: `${env.apiUrl}/v1`,
  });

  return { telliProvider: telliConfiguration(definedModel.name), definedModel };
}
