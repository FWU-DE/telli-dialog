'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  setConversationPersonalContextForUser,
  setPersonalContextAutoUpdateEnabledForUser,
  setPersonalContextEnabledForUser,
  updatePersonalContextForUser,
  type PersonalContextActor,
} from '@shared/personal-context/personal-context-service';
import type { UserAndContext } from '@/auth/types';

function toPersonalContextActor({
  user,
  federalState,
}: {
  user: Pick<UserAndContext, 'id' | 'userRole'>;
  federalState: Pick<UserAndContext['federalState'], 'featureToggles'>;
}): PersonalContextActor {
  return {
    userId: user.id,
    userRole: user.userRole,
    featureToggles: federalState.featureToggles,
  };
}

export async function updatePersonalContextAction({ content }: { content: string }) {
  const { user, federalState } = await requireAuth();

  return runServerAction(
    'updatePersonalContextAction',
    updatePersonalContextForUser,
  )({
    actor: toPersonalContextActor({ user, federalState }),
    content,
  });
}

export async function setPersonalContextEnabledAction({ enabled }: { enabled: boolean }) {
  const { user, federalState } = await requireAuth();

  return runServerAction(
    'setPersonalContextEnabledAction',
    setPersonalContextEnabledForUser,
  )({
    actor: toPersonalContextActor({ user, federalState }),
    enabled,
  });
}

export async function setPersonalContextAutoUpdateEnabledAction({ enabled }: { enabled: boolean }) {
  const { user, federalState } = await requireAuth();

  return runServerAction(
    'setPersonalContextAutoUpdateEnabledAction',
    setPersonalContextAutoUpdateEnabledForUser,
  )({
    actor: toPersonalContextActor({ user, federalState }),
    enabled,
  });
}

export async function setConversationPersonalContextAction({
  conversationId,
  enabled,
}: {
  conversationId: string;
  enabled: boolean | null;
}) {
  const { user, federalState } = await requireAuth();

  return runServerAction(
    'setConversationPersonalContextAction',
    setConversationPersonalContextForUser,
  )({
    actor: toPersonalContextActor({ user, federalState }),
    conversationId,
    enabled,
  });
}
