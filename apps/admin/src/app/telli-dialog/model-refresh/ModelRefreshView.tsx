'use client';

import { useState, useTransition } from 'react';
import { refreshAllModelsAction } from './actions';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { LlmModel } from '@shared/db/schema';

export default function ModelRefreshView() {
  const [isPending, startTransition] = useTransition();
  const [lastRefreshResult, setLastRefreshResult] = useState<Record<string, LlmModel[]> | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await refreshAllModelsAction();
        setLastRefreshResult(result);

        const totalModels = Object.values(result).reduce((sum, models) => sum + models.length, 0);
        const federalStates = Object.keys(result).length;

        toast.success(
          `Modelle erfolgreich aktualisiert! ${totalModels} Modelle in ${federalStates} Bundesländern aktualisiert.`,
        );
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
        setError(errorMessage);
        toast.error(`Fehler beim Aktualisieren der Modelle: ${errorMessage}`);
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LLM-Modelle aktualisieren</CardTitle>
          <CardDescription>
            Aktualisiert die verfügbaren LLM-Modelle für alle Bundesländer, anhand der Telli-API.
          </CardDescription>
          <CardAction>
            <Button
              onClick={handleRefresh}
              disabled={isPending}
              className="flex items-center gap-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isPending ? 'Aktualisiere...' : 'Modelle aktualisieren'}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {lastRefreshResult && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-3">Letztes Aktualisierungsergebnis:</h3>
              <div className="grid gap-3">
                {Object.entries(lastRefreshResult).map(([federalStateId, models]) => (
                  <div key={federalStateId} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{federalStateId}</span>
                      <span className="text-sm text-gray-600">
                        {models.length} {models.length === 1 ? 'Modell' : 'Modelle'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Gesamt:{' '}
                {Object.values(lastRefreshResult).reduce((sum, models) => sum + models.length, 0)}{' '}
                Modelle in {Object.keys(lastRefreshResult).length} Bundesländern
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
