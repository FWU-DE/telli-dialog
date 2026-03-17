'use client';

import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomGptSelectModel } from '@shared/db/schema';
import { BackButton } from './back-button';
import { Card, CardContent } from '@ui/components/Card';
import { Field, FieldLabel, FieldError, FieldGroup } from '@ui/components/Field';
import { Input } from '@ui/components/Input';
import { Controller, useForm, useWatch } from 'react-hook-form';
import z from 'zod';
import { CustomChatLayoutContainer } from './custom-chat-layout-container';
import { CustomChatTitle } from './custom-chat-title';
import { CustomChatActions } from './custom-chat-actions';
import { CustomChatActionUse } from './custom-chat-action-use';
import { CustomChatActionDuplicate } from './custom-chat-action-duplicate';
import { CustomChatActionDelete } from './custom-chat-action-delete';
import { useRouter } from 'next/navigation';
import { createNewCustomGptAction } from '../../../custom/actions';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import {
  deleteCustomGptAction,
  updateCustomGptAction,
} from '../../../custom/editor/[customGptId]/actions';
import { CustomChatShareInfo } from './custom-chat-share-info';
import { CustomChatFormState } from './custom-chat-form-state';
import { CustomChatImageUpload } from './custom-chat-image-upload';
import { CustomChatActionSave } from './custom-chat-action-save';
import { Textarea } from '@ui/components/Textarea';
import { updateCustomGpt } from '@shared/custom-gpt/custom-gpt-service';

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
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('custom-gpt');

  const {
    handleSubmit,
    control,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(assistantFormValuesSchema),
    defaultValues: {
      name: assistant.name,
      description: assistant.description ?? '', // Todo: warum muss man null hier gesondert behandeln?
    },
  });

  const onSubmit = async (data: AssistantFormValues) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    const updateResult = await updateCustomGptAction({ ...assistant, gptId: assistant.id });
    if (updateResult.success) {
      toast.success(t('toasts.edit-toast-success'));
    } else {
      toast.error(t('toasts.edit-toast-error'));
    }

    reset(data);
  };

  const name = useWatch({ control, name: 'name' });

  const handleAutoSave = () => {
    if (isSubmitting || !isDirty) {
      return;
    }

    void handleSubmit(onSubmit)();
  };

  const onDuplicate = async () => {
    const createResult = await createNewCustomGptAction({});
    if (createResult.success) {
      router.push(`/assistants/${createResult.value.id}/edit`);
    } else {
      toast.error(t('toasts.create-toast-error'));
    }
  };

  const onDelete = async () => {
    const deleteResult = await deleteCustomGptAction({ gptId: assistant.id });
    if (deleteResult.success) {
      toast.success(t('toasts.delete-toast-success'));
    }
    if (!deleteResult.success) {
      toast.error(t('toasts.delete-toast-error'));
    }
    router.push('/custom');
  };

  return (
    <CustomChatLayoutContainer>
      <BackButton href="/custom" text="Assistenten" aria-label="Zurück zu den Assistenten" />
      <CustomChatTitle title={name} />
      {/* // Todo: Design fehlt für Statusanzeige  */}
      <div className="flex flex-row justify-between">
        <CustomChatActions>
          <CustomChatActionUse onClick={() => router.push(`/custom/d/${assistant.id}/`)} />
          <CustomChatActionDuplicate onClick={onDuplicate} />
          <CustomChatActionDelete onClick={onDelete} />
          <CustomChatActionSave onClick={handleAutoSave} />
        </CustomChatActions>
        <CustomChatFormState isDirty={isDirty} isSubmitting={isSubmitting} />
      </div>
      {/* Todo: Datum/Uhrzeit letzte Aktualisierung, evtl. mit gespeicher, wird gespeichert*/}
      <CustomChatShareInfo href="#share-settings" />
      <CustomChatImageUpload />

      <form id="assistant-edit-form" onSubmit={handleSubmit(onSubmit)}>
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
