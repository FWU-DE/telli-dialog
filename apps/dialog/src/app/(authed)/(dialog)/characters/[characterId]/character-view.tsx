'use client';

import { CharacterOptionalShareDataModel, FileModel } from '@shared/db/schema';
import { WebsearchSource } from '@shared/db/types';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

import { useLlmModels } from '@/components/providers/llm-model-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import { BackButton } from '@/components/common/back-button';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';
import { CustomChatFieldInfo } from '@/components/custom-chat/custom-chat-field-info';
import { CustomChatAvatarImage } from '@/components/custom-chat/custom-chat-avatar-image';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import { Card, CardContent } from '@ui/components/Card';
import { FieldGroup } from '@ui/components/Field';
import { useToast } from '@/components/common/toast';
import { createNewCharacterAction } from '../actions';
import {
  downloadFileFromCharacterAction,
  shareCharacterAction,
  unshareCharacterAction,
} from '../editor/[characterId]/actions';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatShareWithLearners } from '@/components/custom-chat/custom-chat-share-with-learners';
import {
  telliPointsPercentageValues,
  usageTimeValuesInMinutes,
} from '../../learning-scenarios/editor/[learningScenarioId]/schema';

export function CharacterView({
  character,
  relatedFiles,
  initialLinks,
  avatarPictureUrl,
}: {
  character: CharacterOptionalShareDataModel;
  relatedFiles: FileModel[];
  initialLinks: WebsearchSource[];
  avatarPictureUrl?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('characters');
  const tChat = useTranslations('custom-chat');
  const { models } = useLlmModels();
  const maybeDefaultModelId = getDefaultModel(models)?.id;
  const isModelAvailable = character.modelId && models.some((m) => m.id === character.modelId);
  const selectedModelId = isModelAvailable ? character.modelId : maybeDefaultModelId;
  const selectedModel = models.find((m) => m.id === selectedModelId);

  const handleUseChat = () => {
    router.push(`/characters/d/${character.id}`);
  };

  const handleDuplicateCharacter = async () => {
    const createResult = await createNewCharacterAction({
      templatePictureId: character.pictureId ?? undefined,
      templateId: character.id,
      duplicateCharacterName: t('duplicate-name-format-string', {
        sourceName: character.name,
      }),
    });
    if (createResult.success) {
      router.push(`/characters/editor/${createResult.value.id}?create=true`);
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  const handleDownloadFile = (fileId: string) =>
    downloadFileFromCharacterAction({ characterId: character.id, fileId });

  return (
    <CustomChatLayoutContainer>
      <BackButton
        href="/characters"
        text={t('back-button')}
        aria-label={t('back-button-aria-label')}
      />
      <CustomChatTitle title={character.name} />
      <CustomChatActions>
        <CustomChatActionUse onClick={handleUseChat} />
        <CustomChatActionDuplicate onClick={handleDuplicateCharacter} />
      </CustomChatActions>

      <CustomChatShareWithLearners
        startedAt={character.startedAt ?? null}
        maxUsageTimeLimit={character.maxUsageTimeLimit ?? null}
        pointsPercentageValues={telliPointsPercentageValues}
        usageTimeValues={usageTimeValuesInMinutes}
        onShare={async (data) => {
          const result = await shareCharacterAction({
            id: character.id,
            telliPointsPercentageLimit: data.telliPointsPercentageLimit,
            usageTimeLimit: data.usageTimeLimit,
          });
          return result;
        }}
        onUnshare={async () => {
          const result = await unshareCharacterAction({
            characterId: character.id,
          });
          return result;
        }}
        shareUILink={`/characters/editor/${character.id}/share`}
      />

      <div className="flex flex-col gap-3">
        <CustomChatHeading2 text={t('configuration-heading')} />

        <Card className="justify-center items-center">
          <CardContent className="flex items-center justify-center">
            <CustomChatAvatarImage pictureUrl={avatarPictureUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <FieldGroup>
              <CustomChatFieldInfo label={t('name-label')} value={character.name} />
              <CustomChatFieldInfo label={t('description-label')} value={character.description} />
              {selectedModel && (
                <CustomChatFieldInfo
                  label={tChat('model.label')}
                  value={selectedModel.displayName}
                />
              )}
              <CustomChatFieldInfo label={t('instructions-label')} value={character.instructions} />
              <CustomChatFieldInfo
                label={t('initial-message-label')}
                value={character.initialMessage}
              />
            </FieldGroup>
          </CardContent>
        </Card>

        <CustomChatFilesAndLinks
          initialFiles={relatedFiles}
          initialLinks={initialLinks}
          onDownloadFile={handleDownloadFile}
        />
      </div>
    </CustomChatLayoutContainer>
  );
}
