'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { createSuspensionRequest } from '@shared/suspension/suspension-service';
import { EntityRef } from '@shared/entities/entity-types';

export async function createSuspensionRequestAction({
  entityType,
  entityId,
  reason,
  description,
}: EntityRef & {
  reason: string;
  description: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'createSuspensionRequestAction',
    createSuspensionRequest,
  )({
    entityType,
    entityId,
    requesterId: user.id,
    reason,
    description,
  });
}
