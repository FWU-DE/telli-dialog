'use client';

import { useEffect, useState, useTransition } from 'react';
import z from 'zod';
import { toast } from 'sonner';
import { Button } from '@ui/components/Button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@ui/components/Card';
import { Input } from '@ui/components/Input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import {
  type ToolCallCost,
  type UpdateToolCallCostInput,
  type UpdateToolCallCostPayload,
  updateToolCallCostSchema,
} from '@shared/tool-call-costs/tool-call-cost';
import { getToolCallCostsAction, updateToolCallCostAction } from './actions';

const TOOL_CALL_LABELS: Record<ToolCallCost['toolCallName'], string> = {
  web_search: 'Websuche',
};

function getToolCallLabel(toolCallName: ToolCallCost['toolCallName']) {
  return TOOL_CALL_LABELS[toolCallName];
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Ein unbekannter Fehler ist aufgetreten.';
}

function mapDraftValues(toolCallCosts: ToolCallCost[]) {
  return Object.fromEntries(
    toolCallCosts.map((toolCallCost) => [
      toolCallCost.toolCallName,
      String(toolCallCost.costsInCent),
    ]),
  );
}

export default function ToolCallCostListView() {
  const [toolCallCosts, setToolCallCosts] = useState<ToolCallCost[]>([]);
  const [draftCosts, setDraftCosts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [savingToolCallName, setSavingToolCallName] = useState<ToolCallCost['toolCallName'] | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();

  function loadToolCallCosts() {
    startTransition(async () => {
      try {
        setError(null);
        const loadedToolCallCosts = await getToolCallCostsAction();
        setToolCallCosts(loadedToolCallCosts);
        setDraftCosts(mapDraftValues(loadedToolCallCosts));
      } catch (loadError) {
        const errorMessage = getErrorMessage(loadError);
        setError(errorMessage);
        toast.error(`Fehler beim Laden der Tool Call Kosten: ${errorMessage}`);
      }
    });
  }

  useEffect(() => {
    loadToolCallCosts();
  }, []);

  function updateDraftValue(toolCallName: ToolCallCost['toolCallName'], value: string) {
    setDraftCosts((currentDraftCosts) => ({
      ...currentDraftCosts,
      [toolCallName]: value,
    }));
  }

  function handleSave(toolCallName: ToolCallCost['toolCallName']) {
    const payload: UpdateToolCallCostPayload = {
      toolCallName,
      costsInCent: draftCosts[toolCallName] ?? '',
    };

    let values: UpdateToolCallCostInput;

    try {
      values = updateToolCallCostSchema.parse(payload);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        toast.error(
          validationError.issues[0]?.message ??
            'Bitte geben Sie einen gültigen Preis ab 0 Cent ein.',
        );
        return;
      }

      toast.error(getErrorMessage(validationError));
      return;
    }

    setSavingToolCallName(toolCallName);

    startTransition(async () => {
      try {
        setError(null);
        const updatedToolCallCost = await updateToolCallCostAction(values);

        setToolCallCosts((currentToolCallCosts) =>
          currentToolCallCosts.map((toolCallCost) =>
            toolCallCost.toolCallName === updatedToolCallCost.toolCallName
              ? updatedToolCallCost
              : toolCallCost,
          ),
        );
        setDraftCosts((currentDraftCosts) => ({
          ...currentDraftCosts,
          [updatedToolCallCost.toolCallName]: String(updatedToolCallCost.costsInCent),
        }));
        toast.success('Tool Call Kosten erfolgreich aktualisiert.');
      } catch (saveError) {
        const errorMessage = getErrorMessage(saveError);
        setError(errorMessage);
        toast.error(`Fehler beim Speichern der Tool Call Kosten: ${errorMessage}`);
      } finally {
        setSavingToolCallName(null);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tool Call Kosten</CardTitle>
        <CardAction>
          <Button disabled={isPending} onClick={loadToolCallCosts}>
            {isPending && savingToolCallName === null ? 'Lädt...' : 'Aktualisieren'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
            {error}
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Schlüssel</TableHead>
              <TableHead>Kosten pro Aufruf (Cent)</TableHead>
              <TableHead>Zuletzt aktualisiert</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {toolCallCosts.map((toolCallCost) => {
              const isSavingCurrentRow =
                isPending && savingToolCallName === toolCallCost.toolCallName;

              return (
                <TableRow key={toolCallCost.toolCallName}>
                  <TableCell>{getToolCallLabel(toolCallCost.toolCallName)}</TableCell>
                  <TableCell>{toolCallCost.toolCallName}</TableCell>
                  <TableCell className="w-72">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      showCharacterCount={false}
                      value={draftCosts[toolCallCost.toolCallName] ?? ''}
                      onChange={(event) =>
                        updateDraftValue(toolCallCost.toolCallName, event.currentTarget.value)
                      }
                      disabled={isSavingCurrentRow}
                    />
                  </TableCell>
                  <TableCell>{toolCallCost.updatedAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      disabled={isSavingCurrentRow}
                      onClick={() => handleSave(toolCallCost.toolCallName)}
                    >
                      {isSavingCurrentRow ? 'Speichert...' : 'Speichern'}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
