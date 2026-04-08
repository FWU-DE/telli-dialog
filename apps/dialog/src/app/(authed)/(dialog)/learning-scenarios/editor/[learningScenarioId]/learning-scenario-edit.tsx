'use client';

import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
} from '@/configuration-text-inputs/const';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileModel, LearningScenarioOptionalShareDataModel } from '@shared/db/schema';
import { BackButton } from '@/components/common/back-button';
import { Card, CardContent } from '@ui/components/Card';
import { Field, FieldError, FieldGroup, FieldLabel } from '@ui/components/Field';
import { Input } from '@ui/components/Input';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionDelete } from '@/components/custom-chat/custom-chat-action-delete';
import { CustomChatActionSave } from '@/components/custom-chat/custom-chat-action-save';
import { CustomChatFormState } from '@/components/custom-chat/custom-chat-form-state';
import { useRouter } from 'next/navigation';
import {
  removeFileFromLearningScenarioAction,
  shareLearningScenarioAction,
  unshareLearningScenarioAction,
  updateLearningScenarioAccessLevelAction,
  updateLearningScenarioAction,
  uploadAvatarPictureForLearningScenarioAction,
} from './actions';
import {
  createNewLearningScenarioFromTemplateAction,
  deleteLearningScenarioAction,
  linkFileToLearningScenarioAction,
} from '../../actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { CustomChatShareInfo } from '@/components/custom-chat/custom-chat-share-info';
import { CustomChatImageUpload } from '@/components/custom-chat/custom-chat-image-upload';
import { Textarea } from '@ui/components/Textarea';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { useFormAutosave } from '@/hooks/use-form-autosave';
import { CustomChatFilesAndLinks } from '@/components/custom-chat/custom-chat-files-and-links';
import { CustomChatModelSelect } from '@/components/custom-chat/custom-chat-model-select';
import { WebsearchSource } from '@shared/db/types';
import CustomShareSection from '@/components/custom-chat/custom-chat-share-section';
import { useLlmModels } from '@/components/providers/llm-model-provider';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';
import { CustomChatShareWithLearners } from '@/components/custom-chat/custom-chat-share-with-learners';
import { telliPointsPercentageValues, usageTimeValuesInMinutes } from './schema';
import { CustomChatHeading2 } from '@/components/custom-chat/custom-chat-heading2';

type LearningScenarioTranslator = ReturnType<typeof useTranslations<'learning-scenarios'>>;

function createLearningScenarioFormValuesSchema(t: LearningScenarioTranslator) {
  return z.object({
    name: z.string().min(1, t('name-required')),
    description: z.string(),
    additionalInstructions: z.string(),
    studentExercise: z.string(),
    modelId: z.string(),
    isSchoolShared: z.boolean(),
    hasLinkAccess: z.boolean(),
  });
}

export type LearningScenarioFormValues = z.infer<
  ReturnType<typeof createLearningScenarioFormValuesSchema>
>;

export function LearningScenarioEdit({
  learningScenario,
  relatedFiles,
  initialLinks,
  avatarPictureUrl,
}: {
  learningScenario: LearningScenarioOptionalShareDataModel;
  relatedFiles: FileModel[];
  initialLinks: WebsearchSource[];
  avatarPictureUrl?: string;
}) {
  useForceReloadOnBrowserBackButton();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('learning-scenarios');
  const tToast = useTranslations('learning-scenarios.toasts');
  const learningScenarioFormValuesSchema = useMemo(
    () => createLearningScenarioFormValuesSchema(t),
    [t],
  );

  const { models } = useLlmModels();
  const maybeDefaultModelId = getDefaultModel(models)?.id;
  const isModelAvailable =
    learningScenario.modelId && models.some((m) => m.id === learningScenario.modelId);
  const selectedModelId = isModelAvailable ? learningScenario.modelId : maybeDefaultModelId;

  const initialValues: LearningScenarioFormValues = {
    name: learningScenario.name,
    description: learningScenario.description ?? '',
    additionalInstructions: learningScenario.additionalInstructions ?? '',
    studentExercise: learningScenario.studentExercise ?? '',
    modelId: selectedModelId ?? '',
    isSchoolShared: learningScenario.accessLevel === 'school',
    hasLinkAccess: learningScenario.hasLinkAccess,
  };

  const {
    control,
    trigger,
    getValues,
    reset,
    setValue,
    formState: { isDirty },
  } = useForm<LearningScenarioFormValues>({
    resolver: zodResolver(learningScenarioFormValuesSchema),
    defaultValues: initialValues,
  });

  const { isSaving, hasSaveError, flushAutoSave, handleAutoSave, withAutoSaveOnBlur } =
    useFormAutosave<LearningScenarioFormValues>({
      initialValues,
      isDirty,
      getValues,
      reset: (values) => {
        reset(values);
      },
      validate: trigger,
      saveValues: async (data) => {
        const updateResult = await updateLearningScenarioAction({
          learningScenarioId: learningScenario.id,
          data: {
            ...learningScenario,
            ...data,
            description: data.description ?? '',
            studentExercise: data.studentExercise ?? '',
            attachedLinks: attachedLinksRef.current,
          },
        });

        return updateResult.success;
      },
    });

  const name = useWatch({ control, name: 'name' });
  const savedAccessLevelRef = useRef(learningScenario.accessLevel);
  const attachedLinksRef = useRef(learningScenario.attachedLinks);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isSchoolShared = useWatch({ control, name: 'isSchoolShared' });
  const hasLinkAccess = useWatch({ control, name: 'hasLinkAccess' });
  const showShareInfo = isSchoolShared || hasLinkAccess;

  useEffect(() => {
    if (!name || name.trim().length === 0) {
      nameInputRef.current?.focus();
    }
  }, [name]);

  const saveBeforeLeave = useCallback(async (): Promise<void> => {
    if (!isDirty) {
      return;
    }

    await flushAutoSave();
  }, [flushAutoSave, isDirty]);

  const { guardNavigation } = usePendingChangesGuard({
    hasPendingChanges: isDirty,
    onBeforePageLeave: saveBeforeLeave,
  });

  const handleDuplicateLearningScenario = async () => {
    const createResult = await createNewLearningScenarioFromTemplateAction({
      templateId: learningScenario.id,
      duplicateLearningScenarioName: t('duplicate-name-format-string', {
        sourceName: learningScenario.name,
      }),
    });
    if (createResult.success) {
      guardNavigation(() => {
        router.push(`/learning-scenarios/editor/${createResult.value.id}`);
      });
    } else {
      toast.error(tToast('create-toast-error'));
    }
  };

  const handleDeleteLearningScenario = async () => {
    const deleteResult = await deleteLearningScenarioAction({ id: learningScenario.id });
    if (deleteResult.success) {
      toast.success(tToast('delete-toast-success'));
    } else {
      toast.error(tToast('delete-toast-error'));
    }
    guardNavigation(() => {
      router.push('/learning-scenarios');
    });
  };

  const handleFileUploaded = async (data: { id: string; name: string; file: File }) => {
    const linkResult = await linkFileToLearningScenarioAction({
      fileId: data.id,
      learningScenarioId: learningScenario.id,
    });

    if (!linkResult.success) {
      toast.error(tToast('edit-toast-error'));
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    return await removeFileFromLearningScenarioAction({
      learningScenarioId: learningScenario.id,
      fileId,
    });
  };

  const handleLinksChange = async (links: string[]) => {
    const result = await updateLearningScenarioAction({
      learningScenarioId: learningScenario.id,
      data: {
        ...learningScenario,
        attachedLinks: links,
      },
    });
    if (result.success) {
      attachedLinksRef.current = links;
    }
    return result;
  };

  async function handleUploadPicture(croppedImageBlob: Blob) {
    const result = await uploadAvatarPictureForLearningScenarioAction({
      learningScenarioId: learningScenario.id,
      croppedImageBlob,
    });

    if (result.success) {
      toast.success(tToast('image-toast-success'));
    }

    return result;
  }

  const handleSharingChange = async ({ name, checked }: { name: string; checked: boolean }) => {
    if (name === 'isSchoolShared') {
      const newAccessLevel = checked ? 'school' : 'private';

      if (newAccessLevel !== savedAccessLevelRef.current) {
        const result = await updateLearningScenarioAccessLevelAction({
          learningScenarioId: learningScenario.id,
          accessLevel: newAccessLevel,
        });

        if (!result.success) {
          toast.error(tToast('edit-toast-error'));
          return;
        }

        savedAccessLevelRef.current = newAccessLevel;
      }
    }

    await flushAutoSave();
  };

  return (
    <CustomChatLayoutContainer>
      <BackButton
        href="/learning-scenarios"
        text={t('back-button')}
        aria-label={t('back-button-aria-label')}
        onClick={() => {
          guardNavigation(() => {
            router.push('/learning-scenarios');
          });
        }}
      />
      <CustomChatTitle title={name} />
      <div className="flex flex-row justify-between">
        <CustomChatActions>
          <CustomChatActionDuplicate onClick={handleDuplicateLearningScenario} />
          <CustomChatActionDelete
            onClick={handleDeleteLearningScenario}
            modalTitle={t('delete-modal-title')}
            modalDescription={t('delete-modal-description')}
          />
          <CustomChatActionSave onClick={handleAutoSave} />
        </CustomChatActions>
        <CustomChatFormState
          isDirty={isDirty}
          isSubmitting={isSaving}
          hasSaveError={hasSaveError}
        />
      </div>
      {showShareInfo && (
        <CustomChatShareInfo
          href="#share-settings"
          info={t('sharing-info')}
          linkText={t('sharing-settings')}
        />
      )}

      <CustomChatShareWithLearners
        startedAt={learningScenario.startedAt ?? null}
        maxUsageTimeLimit={learningScenario.maxUsageTimeLimit ?? null}
        pointsPercentageValues={telliPointsPercentageValues}
        usageTimeValues={usageTimeValuesInMinutes}
        onShare={async (data) =>
          await shareLearningScenarioAction({
            learningScenarioId: learningScenario.id,
            data: data as Parameters<typeof shareLearningScenarioAction>[0]['data'],
          })
        }
        onUnshare={async () =>
          await unshareLearningScenarioAction({
            learningScenarioId: learningScenario.id,
          })
        }
        shareUILink={`/learning-scenarios/editor/${learningScenario.id}/share`}
        sharingDisabled={!name || name.trim().length === 0}
      />

      <div className="flex flex-col gap-3">
        <CustomChatHeading2 text={t('configuration-heading')} />

        <CustomChatImageUpload
          avatarPictureUrl={avatarPictureUrl}
          onUploadPicture={handleUploadPicture}
        />

        <form
          id="learning-scenario-edit-form"
          onSubmit={(event) => {
            event.preventDefault();
            handleAutoSave();
          }}
        >
          <Card>
            <CardContent>
              <FieldGroup>
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} aria-required="true">
                      <FieldLabel htmlFor={field.name} required>
                        {t('name-label')}
                      </FieldLabel>
                      <Input
                        {...withAutoSaveOnBlur(field)}
                        ref={nameInputRef}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        aria-label={t('name-label')}
                        placeholder={t('name-placeholder')}
                        autoComplete="off"
                        maxLength={SMALL_TEXT_INPUT_FIELDS_LIMIT}
                        maxLengthErrorMessage={t('name-max-length', {
                          maxLength: SMALL_TEXT_INPUT_FIELDS_LIMIT,
                        })}
                        required
                        data-testid="learning-scenario-name-input"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="description"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} aria-required="true">
                      <FieldLabel htmlFor={field.name}>{t('description-label')}</FieldLabel>
                      <Textarea
                        {...withAutoSaveOnBlur(field)}
                        id={field.name}
                        className="h-27 resize-none"
                        aria-label={t('description-label')}
                        placeholder={t('description-placeholder')}
                        autoComplete="off"
                        maxLengthErrorMessage={t('description-max-length', {
                          maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
                        })}
                        maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
                        data-testid="learning-scenario-description-input"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <CustomChatModelSelect
                  models={models}
                  selectedModelId={selectedModelId ?? undefined}
                  onValueChange={(value) => {
                    setValue('modelId', value, { shouldDirty: true });
                    handleAutoSave();
                  }}
                />
                <Controller
                  name="additionalInstructions"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>{t('instructions-label')}</FieldLabel>
                      <Textarea
                        {...withAutoSaveOnBlur(field)}
                        id={field.name}
                        className="h-125"
                        aria-invalid={fieldState.invalid}
                        placeholder={t('instructions-placeholder')}
                        aria-label={t('instructions-label')}
                        maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS}
                        maxLengthErrorMessage={t('instructions-max-length', {
                          maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT_FOR_DETAILED_SETTINGS,
                        })}
                        autoComplete="off"
                        data-testid="learning-scenario-instructions-input"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  name="studentExercise"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name} tooltip={t('student-exercise-tooltip')}>
                        {t('student-exercise-label')}
                      </FieldLabel>
                      <Textarea
                        {...withAutoSaveOnBlur(field)}
                        id={field.name}
                        className="h-27 resize-none"
                        aria-invalid={fieldState.invalid}
                        placeholder={t('student-exercise-placeholder')}
                        aria-label={t('student-exercise-label')}
                        maxLength={TEXT_INPUT_FIELDS_LENGTH_LIMIT}
                        maxLengthErrorMessage={t('student-exercise-max-length', {
                          maxLength: TEXT_INPUT_FIELDS_LENGTH_LIMIT,
                        })}
                        autoComplete="off"
                        data-testid="learning-scenario-student-exercise-input"
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </FieldGroup>
            </CardContent>
          </Card>

          <CustomChatFilesAndLinks
            initialFiles={relatedFiles}
            onFileUploaded={handleFileUploaded}
            onDeleteFile={handleDeleteFile}
            initialLinks={initialLinks}
            onLinksChange={handleLinksChange}
          />

          <CustomShareSection
            control={control}
            schoolSharingName="isSchoolShared"
            linkSharingName="hasLinkAccess"
            onShareChange={handleSharingChange}
          />
        </form>
      </div>
      <div className="flex flex-row justify-between">
        <CustomChatActions>
          <CustomChatActionDuplicate onClick={handleDuplicateLearningScenario} />
          <CustomChatActionDelete
            onClick={handleDeleteLearningScenario}
            modalTitle={t('delete-modal-title')}
            modalDescription={t('delete-modal-description')}
          />
          <CustomChatActionSave onClick={handleAutoSave} />
        </CustomChatActions>
        <CustomChatFormState
          isDirty={isDirty}
          isSubmitting={isSaving}
          hasSaveError={hasSaveError}
        />
      </div>
    </CustomChatLayoutContainer>
  );
}
