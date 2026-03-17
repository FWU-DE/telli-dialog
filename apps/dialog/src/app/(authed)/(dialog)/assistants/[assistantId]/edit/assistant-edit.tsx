'use client';

import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { zodResolver } from '@hookform/resolvers/zod';
import { CustomGptSelectModel } from '@shared/db/schema';
import { BackButton } from './back-button';
import { Card, CardContent } from '@ui/components/Card';
import { Field, FieldLabel, FieldError } from '@ui/components/Field';
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
import { deleteCustomGptAction } from '../../../custom/editor/[customGptId]/actions';

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
      <div className="flex justify-between my-4">
        <span>{isSubmitting ? '...wird gespeichert' : 'gespeichert'}</span>
      </div>
      <CustomChatActions>
        <CustomChatActionUse onClick={() => router.push(`/custom/d/${assistant.id}/`)} />
        <CustomChatActionDuplicate onClick={onDuplicate} />
        <CustomChatActionDelete onClick={onDelete} />
      </CustomChatActions>

      {/* Todo: Datum/Uhrzeit letzte Aktualisierung, evtl. mit gespeicher, wird gespeichert*/}

      <form id="assistant-edit-form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardContent>
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
                    placeholder=""
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
            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Beschreibung des Assistenten</FieldLabel>
                  <Input
                    {...field}
                    id="field.description"
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
          </CardContent>
        </Card>
        <div>Instruktionen</div>
        <div>Liste mit Promptvorschlägen</div>
        <div>Hintergrundwissen</div>
        <div>Freigabe</div>
      </form>
    </CustomChatLayoutContainer>
  );
}
