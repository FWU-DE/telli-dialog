'use server';

import { LlmModelSelectModel } from '@shared/db/schema';
import { handleImageGeneration } from './image-generation-service';
import { ImageStyle } from '@shared/utils/chat';
import { runServerAction } from '@shared/actions/run-server-action';
import { requireAuth } from '@/auth/requireAuth';

/**
 * Generates an image within an existing conversation using the image generation service
 * Combines the conversation management with the actual image generation API
 */
export async function generateImageAction({
  prompt,
  model,
  style,
}: {
  prompt: string;
  model: LlmModelSelectModel;
  style?: ImageStyle;
}) {
  const { user, federalState } = await requireAuth();

  return runServerAction(handleImageGeneration)({
    prompt,
    model,
    style,
    userId: user.id,
    federalStateId: federalState.id,
  });
}
