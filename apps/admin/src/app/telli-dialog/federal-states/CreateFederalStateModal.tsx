'use client';
import { Button } from '@ui/components/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFederalStateAction } from './[federalStateId]/actions';
import { FormField } from '@ui/components/form/FormField';
import { toast } from 'sonner';
import z from 'zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { ROUTES } from '@/consts/routes';

export type CreateFederalStateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

// Minimal form schema - only mandatory fields without defaults
export const createFederalStateFormSchema = z.object({
  id: z.string().min(1, 'ID ist erforderlich'),
  encryptedApiKey: z.string().optional().default(''), // Optional but useful for setup
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
  });

  async function onSubmit(data: CreateFederalStateForm) {
    if (!isValid) {
      toast.error('Das Formular enthält ungültige Werte.');
      return;
    }

    try {
      await createFederalStateAction({
        id: data.id,
        encryptedApiKey: data.encryptedApiKey || null,
      });

      toast.success('Bundesland erfolgreich erstellt');
      reset();
      onClose();
      if (onSuccess) {
        onSuccess();
      }
      router.push(ROUTES.dialog.federalStateDetails(data.id));
    } catch (error) {
      console.error('Error creating federal state:', error);
      toast.error('Fehler beim Erstellen des Bundeslands');
    }
  }

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      reset();
      onClose();
    }
  }, [isSubmitting, reset, onClose]);

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
  }, [isOpen, isSubmitting, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/25 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Neues Bundesland erstellen</h2>

        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
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
            name="encryptedApiKey"
            label="API Key (Optional)"
            description="API Key für die Kommunikation mit telli-api. Kann auch später hinzugefügt werden."
            control={control}
            type="password"
          />

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Wird erstellt...' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
