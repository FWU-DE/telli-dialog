'use client';

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';

import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { FormField } from '@ui/components/form/FormField';
import { Button } from '@ui/components/Button';
import { toast } from 'sonner';
import { FederalStateModel } from '@shared/federal-states/types';
import { updateApiKey } from '@shared/federal-states/federal-state-service';

export type FederalStateUpdateApiKeyProps = {
  federalState: FederalStateModel;
};

const patchApiKeySchema = z.object({
  decryptedApiKey: z.string().min(1, 'API Key darf nicht leer sein'),
});
export type PatchApiKey = z.infer<typeof patchApiKeySchema>;

export function FederalStateUpdateApiKey(props: FederalStateUpdateApiKeyProps) {
  const federalState = props.federalState;

  const form = useForm<PatchApiKey>({
    resolver: zodResolver(patchApiKeySchema),
    defaultValues: {
      decryptedApiKey: '',
    },
  });

  const {
    control,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = form;

  async function onSubmit(data: PatchApiKey) {
    try {
      await updateApiKey(federalState.id, data.decryptedApiKey);
      reset();
      toast.success('API Key erfolgreich aktualisiert.');
    } catch {
      toast.error('Fehler beim Aktualisieren des API Keys.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key aktualisieren</CardTitle>
        <CardDescription>
          Aktualisiert den API Key für das Bundesland {federalState.id}. Vorsicht! Der alte API Key
          ist dann nicht mehr gültig und kann nicht mehr verwendet werden.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="decryptedApiKey"
            label="API Key"
            description="Der neue, unverschlüsselte API Key der in telli-api generiert wurde."
            control={control}
          />
          <CardAction>
            <Button type="submit" disabled={!isDirty}>
              Speichern
            </Button>
          </CardAction>
        </form>
      </CardContent>
    </Card>
  );
}
