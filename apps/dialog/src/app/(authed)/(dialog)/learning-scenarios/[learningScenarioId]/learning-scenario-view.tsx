'use client';

import { BackButton } from '@/components/common/back-button';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatLastUpdate } from '@/components/custom-chat/custom-chat-last-update';
import { CustomChatAvatarImage } from '@/components/custom-chat/custom-chat-avatar-image';
import { CustomChatFields } from '@/components/custom-chat/custom-chat-fields';
import { CustomChatFieldInfo } from '@/components/custom-chat/custom-chat-field-info';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import type { FileModel, LearningScenarioOptionalShareDataModel } from '@shared/db/schema';
import type { WebsearchSource } from '@shared/db/types';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import {
  createNewLearningScenarioFromTemplateAction,
  downloadFileFromLearningScenarioAction,
} from '../actions';
import { Card, CardContent } from '@ui/components/Card';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';
import { CustomChatShareWithLearners } from '@/components/custom-chat/custom-chat-share-with-learners';
import {
  telliPointsPercentageValues,
  usageTimeValuesInMinutes,
} from '../editor/[learningScenarioId]/schema';
import {
  shareLearningScenarioAction,
  unshareLearningScenarioAction,
} from '../editor/[learningScenarioId]/actions';

export function LearningScenarioView({
  learningScenario,
  fileMappings,
  pictureUrl,
  initialLinks,
}: {
  learningScenario: LearningScenarioOptionalShareDataModel;
  fileMappings: FileModel[];
  pictureUrl: string | undefined;
  initialLinks: WebsearchSource[];
}) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('learning-scenarios');
  const tToast = useTranslations('learning-scenarios.toasts');
  const { models } = useLlmModels();

  const modelDisplayName = models.find((m) => m.id === learningScenario.modelId)?.displayName;

  const handleDuplicateLearningScenario = async () => {
    const createResult = await createNewLearningScenarioFromTemplateAction({
      templateId: learningScenario.id,
      duplicateLearningScenarioName: t('duplicate-name-format-string', {
        sourceName: learningScenario.name,
      }),
    });
    if (createResult.success) {
      router.push(`/learning-scenarios/editor/${createResult.value.id}`);
    } else {
      toast.error(tToast('create-toast-error'));
    }
  };

  const handleShareLearningScenario = async (
    data: Parameters<typeof shareLearningScenarioAction>[0]['data'],
  ) => {
    const result = await shareLearningScenarioAction({
      learningScenarioId: learningScenario.id,
      data,
    });
    return result;
  };

  const handleUnshareLearningScenario = async () => {
    const result = await unshareLearningScenarioAction({
      learningScenarioId: learningScenario.id,
    });
    return result;
  };

  async function handleDownloadFile(fileId: string) {
    return downloadFileFromLearningScenarioAction({
      learningScenarioId: learningScenario.id,
      fileId,
    });
  }

  return (
    <CustomChatLayoutContainer>
      <BackButton
        href="/learning-scenarios"
        text={t('back-button')}
        aria-label={t('back-button-aria-label')}
      />
      <CustomChatTitle title={learningScenario.name} />
      <CustomChatActions>
        <CustomChatActionDuplicate onClick={handleDuplicateLearningScenario} />
        <CustomChatLastUpdate date={learningScenario.updatedAt} />
      </CustomChatActions>

      <CustomChatShareWithLearners
        startedAt={learningScenario.startedAt ?? null}
        stoppedAt={learningScenario.stoppedAt ?? null}
        maxUsageTimeLimit={learningScenario.maxUsageTimeLimit ?? null}
        telliPointsLimit={learningScenario.telliPointsLimit ?? null}
        pointsPercentageValues={telliPointsPercentageValues}
        usageTimeValues={usageTimeValuesInMinutes}
        onShare={handleShareLearningScenario}
        onUnshare={handleUnshareLearningScenario}
        shareUILink={`/learning-scenarios/editor/${learningScenario.id}/share`}
        sharingDisabled={!learningScenario.name || learningScenario.name.trim().length === 0}
      />

      <div className="flex flex-col gap-3">
        <CustomChatHeading2 text={t('configuration-heading')} />

        <Card>
          <CardContent className="flex justify-center items-center">
            <CustomChatAvatarImage pictureUrl={pictureUrl} />
          </CardContent>
        </Card>

        {learningScenario.accessLevel === 'global' && (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center">
              <div className="text-sm text-foreground/70">{t('author-label')}</div>
              <div className="text-base font-medium">{t('author-text')}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <CustomChatFields>
              <CustomChatFieldInfo label={t('name-label')} value={learningScenario.name} />
              <CustomChatFieldInfo
                label={t('description-label')}
                value={learningScenario.description}
              />
              {modelDisplayName && (
                <CustomChatFieldInfo label={t('form.model-label')} value={modelDisplayName} />
              )}
              <CustomChatFieldInfo
                label={t('instructions-label')}
                value={learningScenario.additionalInstructions}
              />
              <CustomChatFieldInfo
                label={t('student-exercise-label')}
                value={learningScenario.studentExercise}
              />
            </CustomChatFields>
          </CardContent>
        </Card>
      </div>
      <CustomChatFilesAndLinks
        initialFiles={fileMappings}
        initialLinks={initialLinks}
        onDownloadFile={handleDownloadFile}
      />
    </CustomChatLayoutContainer>
  );
}
