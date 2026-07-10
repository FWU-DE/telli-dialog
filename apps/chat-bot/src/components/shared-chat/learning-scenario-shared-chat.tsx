'use client';

import { useLearningScenarioChat } from '@/hooks/use-chat-hooks';
import { useTranslations } from 'next-intl';
import { LearningScenarioWithShareDataModel } from '@shared/db/schema';
import GenericSharedChat from './generic-shared-chat';
import { z } from 'zod';

export default function LearningScenarioSharedChat({
  avatarPictureUrl,
  ...sharedSchoolChat
}: LearningScenarioWithShareDataModel & { inviteCode: string; avatarPictureUrl?: string }) {
  const t = useTranslations('learning-scenarios.shared');
  const { id, inviteCode, modelId } = sharedSchoolChat;

  const chat = useLearningScenarioChat({
    learningScenarioId: id,
    inviteCode,
    initialMessages: [],
    modelId: modelId ?? undefined,
  });

  async function uploadSharedLearningScenarioFile(
    file: File,
    sharedSessionId: string,
  ): Promise<{ fileId: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('inviteCode', inviteCode);
    formData.append('learningScenarioId', id);
    formData.append('sharedSessionId', sharedSessionId);

    const response = await fetch('/api/v1/shared-chat/files', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Could not upload file');
    }

    const json = await response.json();
    const parsed = z.object({ file_id: z.string() }).parse(JSON.parse(json?.body));

    return {
      fileId: parsed.file_id,
    };
  }

  async function getSignedUrlForSharedLearningScenarioFile(
    fileId: string,
    sharedSessionId: string,
  ): Promise<string> {
    const response = await fetch('/api/v1/shared-chat/files/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteCode,
        learningScenarioId: id,
        fileId,
        sharedSessionId,
      }),
    });

    if (!response.ok) {
      throw new Error('Could not read file');
    }

    const json = await response.json();
    const parsed = z.object({ signedUrl: z.string() }).parse(json);

    return parsed.signedUrl;
  }

  return (
    <GenericSharedChat
      headerT={t}
      entity={sharedSchoolChat}
      inviteCode={inviteCode}
      avatarPictureUrl={avatarPictureUrl}
      chat={chat}
      dialogStartMode="explicit"
      enableFloatingText
      exerciseDescription={sharedSchoolChat.studentExercise}
      exerciseTitle={t('excercise-title')}
      uploadFileFn={uploadSharedLearningScenarioFile}
      getSignedUrlFn={getSignedUrlForSharedLearningScenarioFile}
    />
  );
}
