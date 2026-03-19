'use client';

import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomGptSelectModel } from '@shared/db/schema';
import { BackButton } from '@/components/common/back-button';
import { Card, CardContent } from '@ui/components/Card';
import { Field, FieldLabel, FieldError, FieldGroup } from '@ui/components/Field';
import { Input } from '@ui/components/Input';
import { Controller, useForm, useWatch } from 'react-hook-form';
import z from 'zod';
import { CustomChatLayoutContainer } from '@/components/custom-chat/custom-chat-layout-container';
import { CustomChatTitle } from '@/components/custom-chat/custom-chat-title';
import { CustomChatActions } from '@/components/custom-chat/custom-chat-actions';
import { CustomChatActionUse } from '@/components/custom-chat/custom-chat-action-use';
import { CustomChatActionDuplicate } from '@/components/custom-chat/custom-chat-action-duplicate';
import { CustomChatActionDelete } from '@/components/custom-chat/custom-chat-action-delete';
import { useRouter } from 'next/navigation';
import { createNewCustomGptAction } from '../../../custom/actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import {
  deleteCustomGptAction,
  updateCustomGptAction,
} from '../../../custom/editor/[customGptId]/actions';
import { CustomChatShareInfo } from '@/components/custom-chat/custom-chat-share-info';
import { CustomChatFormState } from '@/components/custom-chat/custom-chat-form-state';
import { CustomChatImageUpload } from '@/components/custom-chat/custom-chat-image-upload';
import { CustomChatActionSave } from '@/components/custom-chat/custom-chat-action-save';
import { Textarea } from '@ui/components/Textarea';
import { useCallback } from 'react';
import { usePendingChangesGuard } from '@/hooks/use-pending-changes-guard';
import { useForceReloadOnBrowserBackButton } from '@/hooks/use-force-reload-on-browser-back-button';
import { useFormAutosave } from '@/hooks/use-form-autosave';

const assistantFormValuesSchema = z.object({
  name: z.string().min(1, 'Der Name darf nicht leer sein.'),
  description: z
    .string()
    .max(
      TEXT_INPUT_FIELDS_LENGTH_LIMIT,
      `Die Beschreibung darf maximal ${TEXT_INPUT_FIELDS_LENGTH_LIMIT} Zeichen lang sein.`,
    ),
});
type AssistantFormValues = z.infer<typeof assistantFormValuesSchema>;

export function AssistantEdit({ assistant }: { assistant: CustomGptSelectModel }) {
  useForceReloadOnBrowserBackButton();
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');
  const initialValues: AssistantFormValues = {
    name: assistant.name,
    description: assistant.description ?? '',
  };

  const {
    control,
    trigger,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm<AssistantFormValues>({
    resolver: zodResolver(assistantFormValuesSchema),
    defaultValues: initialValues,
  });

  const { isSaving, hasSaveError, flushAutoSave, handleAutoSave } =
    useFormAutosave<AssistantFormValues>({
      initialValues,
      isDirty,
      getValues,
      reset: (values) => {
        reset(values);
      },
      validate: trigger,
      saveValues: async (data) => {
        const updateResult = await updateCustomGptAction({
          gptId: assistant.id,
          name: data.name,
          description: data.description,
        });

        return updateResult.success;
      },
    });

  const name = useWatch({ control, name: 'name' });

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

  const handleDuplicateAssistant = async () => {
    const createResult = await createNewCustomGptAction({});
    if (createResult.success) {
      guardNavigation(() => {
        router.push(`/assistants/${createResult.value.id}/edit`);
      });
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  const handleDeleteAssistant = async () => {
    const deleteResult = await deleteCustomGptAction({ gptId: assistant.id });
    if (deleteResult.success) {
      toast.success(t('toasts.delete-toast-success'));
    }
    if (!deleteResult.success) {
      toast.error(t('toasts.delete-toast-error'));
    }
    guardNavigation(() => {
      router.push('/custom');
    });
  };

  return (
    <CustomChatLayoutContainer>
      {/* // Todo: Maybe we have to remember where we come from and which filters were set */}
      <BackButton
        href="/custom"
        text="Assistenten"
        aria-label="Zurück zu den Assistenten"
        onClick={() => {
          guardNavigation(() => {
            router.push('/custom');
          });
        }}
      />
      <CustomChatTitle title={name} />
      {/* // Todo: Design fehlt für Statusanzeige  */}
      <div className="flex flex-row justify-between">
        <CustomChatActions>
          <CustomChatActionUse
            onClick={() => {
              guardNavigation(() => {
                router.push(`/custom/d/${assistant.id}/`);
              });
            }}
          />
          <CustomChatActionDuplicate onClick={handleDuplicateAssistant} />
          <CustomChatActionDelete onClick={handleDeleteAssistant} />
          <CustomChatActionSave onClick={handleAutoSave} />
        </CustomChatActions>
        <CustomChatFormState
          isDirty={isDirty}
          isSubmitting={isSaving}
          hasSaveError={hasSaveError}
        />
      </div>
      {/* Todo: Datum/Uhrzeit letzte Aktualisierung, evtl. mit gespeicher, wird gespeichert*/}
      <CustomChatShareInfo href="#share-settings" />
      <CustomChatImageUpload />

      <form
        id="assistant-edit-form"
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
                    <FieldLabel htmlFor={field.name}>Name des Assistenten</FieldLabel>
                    <Input
                      {...field}
                      id="field.name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Name des Assistenten"
                      autoComplete="off"
                      required
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Kurzbeschreibung</FieldLabel>
                    <Textarea
                      {...field}
                      id="field.description"
                      className="h-27 resize-none"
                      aria-invalid={fieldState.invalid}
                      placeholder="Beschreibung des Assistenten"
                      autoComplete="off"
                      onBlur={() => {
                        field.onBlur();
                        handleAutoSave();
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
        </Card>
        <div>Instruktionen</div>
        <div>Liste mit Promptvorschlägen</div>
        <div>Hintergrundwissen</div>
        <div id="share-settings">Freigabe</div>
      </form>
    </CustomChatLayoutContainer>
  );
}
