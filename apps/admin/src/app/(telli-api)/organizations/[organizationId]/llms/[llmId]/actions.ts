'use server';

import { createLargeLanguageModel, updateLargeLanguageModel } from '@/services/llm-service';

export async function createLLMAction(
  organizationId: string,
  data: {
    name: string;
    displayName: string;
    provider: string;
    description?: string;
    setting?: string;
    priceMetadata?: string;
    supportedImageFormats?: string;
    additionalParameters?: string;
    isNew: boolean;
    isDeleted: boolean;
  }
) {
  // TODO: Add authentication check
  try {
    const result = await createLargeLanguageModel(organizationId, data);
    return result;
  } catch (error) {
    console.error('Error creating LLM:', error);
    throw error;
  }
}

export async function updateLLMAction(
  organizationId: string,
  llmId: string,
  data: {
    name: string;
    displayName: string;
    provider: string;
    description?: string;
    setting?: string;
    priceMetadata?: string;
    supportedImageFormats?: string;
    additionalParameters?: string;
    isNew: boolean;
    isDeleted: boolean;
  }
) {
  // TODO: Add authentication check
  try {
    const result = await updateLargeLanguageModel(organizationId, llmId, data);
    return result;
  } catch (error) {
    console.error('Error updating LLM:', error);
    throw error;
  }
}