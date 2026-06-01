'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  createSuspensionRequest,
  SuspensionEntityRef,
} from '@shared/suspension/suspension-service';

export async function createSuspensionRequestAction({
  entityType,
  entityId,
  reason,
  description,
}: SuspensionEntityRef & {
  reason: string;
  description: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(createSuspensionRequest)({
    entityType,
    entityId,
    requesterId: user.id,
    reason,
    description,
  });
}
