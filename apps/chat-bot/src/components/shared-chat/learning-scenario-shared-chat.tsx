'use client';

import { useLearningScenarioChat } from '@/hooks/use-chat-hooks';
import { useTranslations } from 'next-intl';
import { LearningScenarioWithShareDataModel } from '@shared/db/schema';
import { useCheckStatusCode } from '@/hooks/use-response-status';
import GenericSharedChat from './generic-shared-chat';

export default function LearningScenarioSharedChat({
  avatarPictureUrl,
  ...sharedSchoolChat
}: LearningScenarioWithShareDataModel & { inviteCode: string; avatarPictureUrl?: string }) {
  const t = useTranslations('learning-scenarios.shared');
  const { id, inviteCode, modelId } = sharedSchoolChat;

  const errorState = useCheckStatusCode();
  const chat = useLearningScenarioChat({
    learningScenarioId: id,
    inviteCode,
    initialMessages: [],
    modelId: modelId ?? undefined,
    onError: errorState.handleError,
  });

  return (
    <GenericSharedChat
      headerT={t}
      entity={sharedSchoolChat}
      inviteCode={inviteCode}
      avatarPictureUrl={avatarPictureUrl}
      chat={chat}
      errorState={errorState}
      dialogStartMode="explicit"
      enableFloatingText
      exerciseDescription={sharedSchoolChat.studentExercise}
      exerciseTitle={t('excercise-title')}
    />
  );
}
