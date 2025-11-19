'use client';
import { Button } from '@ui/components/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFederalStateAction } from './[federalStateId]/actions';
import { FormField } from '@ui/components/form/FormField';
import { toast } from 'sonner';
import z from 'zod';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export type CreateFederalStateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

// Minimal form schema - only mandatory fields without defaults
export const createFederalStateFormSchema = z.object({
  id: z.string().min(1, 'ID ist erforderlich'),
  apiKey: z.string().optional().default(''), // Optional but useful for setup
});

export type CreateFederalStateForm = z.infer<typeof createFederalStateFormSchema>;

export function CreateFederalStateModal(props: CreateFederalStateModalProps) {
  const { isOpen, onClose, onSuccess } = props;
  const router = useRouter();

  const {
    control,
    formState: { isValid, errors, isSubmitting },
    handleSubmit,
    reset,
  } = useForm<CreateFederalStateForm>({
    resolver: zodResolver(createFederalStateFormSchema),
    defaultValues: {
      id: '',
      apiKey: '',
    },
  });

  async function onSubmit(data: CreateFederalStateForm) {
    if (!isValid) {
      toast.error('Das Formular enthält ungültige Werte.');
      return;
    }

    try {
      await createFederalStateAction({
        id: data.id,
        encryptedApiKey: data.apiKey || null,
      });

      toast.success('Bundesland erfolgreich erstellt');
      reset();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      router.push(`/telli-dialog/federal-states/${data.id}`);
    } catch (error) {
      console.error('Error creating federal state:', error);
      toast.error('Fehler beim Erstellen des Bundeslands');
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, isSubmitting]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Neues Bundesland erstellen</h2>
          <p className="text-sm text-gray-600 mt-1">
            Geben Sie die erforderlichen Grunddaten für das neue Bundesland ein.
          </p>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="text-red-500 text-sm">
            <p>Bitte korrigieren Sie die folgenden Fehler:</p>
            <ul className="list-disc list-inside">
              {Object.entries(errors).map(([field, error]) => (
                <li key={field}>{error?.message}</li>
              ))}
            </ul>
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FormField
            name="id"
            label="ID"
            description="Eindeutige ID des Bundeslandes (z.B. DE-BY, DE-NW)."
            control={control}
          />

          <FormField
            name="apiKey"
            label="API Key (Optional)"
            description="API Key für die Kommunikation mit telli-api. Kann auch später hinzugefügt werden."
            control={control}
            type="password"
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
