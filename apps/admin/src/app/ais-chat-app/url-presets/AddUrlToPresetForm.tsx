'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { Button } from '@ui/components/button';
import { Input } from '@ui/components/input';
import { Field, FieldError } from '@ui/components/field';
import { domainPattern, normalizeDomain } from '@shared/utils/url-utils';

const addUrlFormSchema = z.object({
  url: z.string().trim().min(1, 'URL ist erforderlich').regex(domainPattern, 'Ungültige URL'),
});

type AddUrlForm = z.infer<typeof addUrlFormSchema>;

export type AddUrlToPresetFormProps = {
  existingUrls: string[];
  onAdd: (url: string) => Promise<void>;
};

export function AddUrlToPresetForm({ existingUrls, onAdd }: AddUrlToPresetFormProps) {
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    reset,
    setError,
  } = useForm<AddUrlForm>({
    resolver: zodResolver(addUrlFormSchema),
    defaultValues: { url: '' },
  });

  async function onSubmit(data: AddUrlForm) {
    const url = normalizeDomain(data.url);
    if (!url) {
      setError('url', { message: 'Ungültige URL' });
      return;
    }
    if (existingUrls.includes(url)) {
      setError('url', { message: 'Diese URL ist bereits in der Liste' });
      return;
    }

    await onAdd(url);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <Controller
        name="url"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Field orientation="horizontal">
              <Input
                {...field}
                placeholder="example.com"
                aria-invalid={fieldState.invalid}
                aria-label="URL"
                autoComplete="off"
              />
              <Button type="submit" disabled={isSubmitting}>
                Hinzufügen
              </Button>
            </Field>
            {fieldState.invalid && <FieldError>{fieldState.error?.message}</FieldError>}
          </Field>
        )}
      />
    </form>
  );
}
