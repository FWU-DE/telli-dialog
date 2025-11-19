'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { Label } from '@ui/components/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/Select';
import { toast } from 'sonner';
import { createApiKeyAction } from '../actions';

type CreateApiKeyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organizationId: string;
  projectId: string;
};

export function CreateApiKeyModal({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  projectId,
}: CreateApiKeyModalProps) {
  const [name, setName] = useState('');
  const [state, setState] = useState<'active' | 'inactive' | 'deleted'>('active');
  const [limitInCent, setLimitInCent] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdApiKey, setCreatedApiKey] = useState<{ plainKey: string; name: string } | null>(
    null,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('API-Schlüssel-Name ist erforderlich');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const limitValue = limitInCent ? parseInt(limitInCent) : undefined;
      const expiresValue = expiresAt ? new Date(expiresAt) : null;

      const result = await createApiKeyAction(
        organizationId,
        projectId,
        name,
        state,
        limitValue,
        expiresValue,
      );

      // Show the plainKey to the user - this is critical as it can't be retrieved later
      setCreatedApiKey({
        plainKey: (result as any).plainKey, // The API returns plainKey on creation
        name: result.name,
      });

      toast.success('API-Schlüssel erfolgreich erstellt');
      onSuccess?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = React.useCallback(() => {
    setName('');
    setState('active');
    setLimitInCent('');
    setExpiresAt('');
    setError(null);
    setCreatedApiKey(null);
    onClose();
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/25 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          {createdApiKey ? 'API-Schlüssel erfolgreich erstellt!' : 'Neuen API-Schlüssel erstellen'}
        </h2>

        {createdApiKey ? (
          // Show the created API key with plainKey
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center mb-2">
                <svg
                  className="h-5 w-5 text-green-400 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-green-800">
                  API-Schlüssel erstellt: {createdApiKey.name}
                </span>
              </div>
              <div className="text-sm text-green-700 mb-3">
                <strong>⚠️ WICHTIG:</strong> Kopieren Sie diesen Schlüssel jetzt! Er kann später
                nicht mehr angezeigt werden und wird für die API-Authentifizierung benötigt.
              </div>
            </div>

            <div>
              <Label htmlFor="plainKey">API-Schlüssel (Plain Key)</Label>
              <div className="flex space-x-2">
                <Input
                  id="plainKey"
                  type="text"
                  value={createdApiKey.plainKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(createdApiKey.plainKey);
                    toast.success('API-Schlüssel in Zwischenablage kopiert');
                  }}
                >
                  Kopieren
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Schließen</Button>
            </div>
          </div>
        ) : (
          // Show the creation form
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiKeyName">Name *</Label>
                <Input
                  id="apiKeyName"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Geben Sie den API-Schlüssel-Namen ein..."
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="apiKeyState">Status</Label>
                <Select
                  value={state}
                  onValueChange={(value: 'active' | 'inactive' | 'deleted') => setState(value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                    <SelectItem value="deleted">Gelöscht</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="limitInCent">Limit in Cent (optional)</Label>
                <Input
                  id="limitInCent"
                  type="number"
                  value={limitInCent}
                  onChange={(e) => setLimitInCent(e.target.value)}
                  placeholder="z.B. 1000"
                  disabled={isLoading}
                  min="0"
                />
              </div>

              <div>
                <Label htmlFor="expiresAt">Läuft ab am (optional)</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Wird erstellt...' : 'Erstellen'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
