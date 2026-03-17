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

  return (
    // Extract that into separate component
    <div className="max-w-3xl mx-auto mt-4">
      <BackButton href="/assistants" text="Assistenten" aria-label="Zurück zu den Assistenten" />
      <div className="flex justify-between my-4">
        <h1 className="text-2xl font-bold">{name}</h1>
        <span>{isSubmitting ? '...wird gespeichert' : 'gespeichert'}</span>
      </div>

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
    </div>
  );
}
