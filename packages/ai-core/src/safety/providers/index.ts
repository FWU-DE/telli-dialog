import { ProviderConfigurationError } from '../../errors';
import type { AiModel, SafetyCheckFn } from '../types';
import { constructGoogleSafetyCheckFn } from './google';

function getSafetyCheckFnByModel(model: AiModel): SafetyCheckFn | undefined {
  if (model.provider === 'google') {
    return constructGoogleSafetyCheckFn(model);
  }
  if (model.provider === 'bifrost') {
    // Bifrost cannot address custom Vertex endpoints, so use Vertex directly for safety models.
    if (model.setting.provider !== 'google') {
      throw new ProviderConfigurationError(
        'Bifrost safety models must use Google provider settings for direct Vertex routing',
      );
    }

    return constructGoogleSafetyCheckFn(model);
  }
  return undefined;
}

export async function checkSafety(model: AiModel, text: string) {
  const checkFn = getSafetyCheckFnByModel(model);
  if (!checkFn) {
    throw new ProviderConfigurationError(
      `No safety check function found for provider: ${model.provider}`,
    );
  }
  return checkFn({ model: model.name, text });
}
