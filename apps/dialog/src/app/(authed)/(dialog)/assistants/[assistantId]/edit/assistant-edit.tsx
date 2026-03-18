'use client';

import { TEXT_INPUT_FIELDS_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { deepEqual } from '@/utils/object';
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
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const initialValues: AssistantFormValues = {
    name: assistant.name,
    description: assistant.description ?? '',
  };

  const [isSaving, setIsSaving] = useState(false);
  const [hasSaveError, setHasSaveError] = useState(false);
  const latestValuesRef = useRef<AssistantFormValues>(initialValues);
  const lastSavedValuesRef = useRef<AssistantFormValues>(initialValues);
  const isSavingRef = useRef(false);
  const saveQueuedRef = useRef(false);
  const flushRunningRef = useRef(false);

  const {
    control,
    trigger,
    getValues,
    reset,
    formState: { isDirty },
  } = useForm({
    resolver: zodResolver(assistantFormValuesSchema),
    defaultValues: initialValues,
  });

  const saveCurrentValues = async (): Promise<void> => {
    const isValid = await trigger();
    if (!isValid) {
      return;
    }

    const data = getValues();
    if (deepEqual(data, lastSavedValuesRef.current)) {
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const updateResult = await updateCustomGptAction({
        gptId: assistant.id,
        name: data.name,
        description: data.description,
      });
      if (updateResult.success) {
        setHasSaveError(false);
        lastSavedValuesRef.current = data;
        reset(data);
      } else {
        setHasSaveError(true);
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const flushAutoSave = async () => {
    if (flushRunningRef.current) {
      saveQueuedRef.current = true;
      return;
    }

    flushRunningRef.current = true;
    try {
      do {
        saveQueuedRef.current = false;
        await saveCurrentValues();
      } while (saveQueuedRef.current);
    } finally {
      flushRunningRef.current = false;
    }
  };

  const sendBestEffortSave = useCallback(() => {
    const data = latestValuesRef.current;
    if (deepEqual(data, lastSavedValuesRef.current)) {
      return;
    }

    const url = `/api/assistants/${assistant.id}/autosave`;
    const payload = JSON.stringify(data);

    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
      return;
    }

    void fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: payload,
      keepalive: true,
    });
  }, [assistant.id]);

  const name = useWatch({ control, name: 'name' });
  const values = useWatch({ control }) as AssistantFormValues;

  useEffect(() => {
    latestValuesRef.current = values;
    if (isSavingRef.current) {
      saveQueuedRef.current = true;
    }
  }, [values]);

  useEffect(() => {
    const handlePageHide = () => {
      sendBestEffortSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendBestEffortSave();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sendBestEffortSave]);

  const handleAutoSave = () => {
    if (!isDirty) {
      return;
    }

    void flushAutoSave();
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
