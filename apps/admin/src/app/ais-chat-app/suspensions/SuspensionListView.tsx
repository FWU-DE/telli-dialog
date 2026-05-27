'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/components/card';
import {
  getSuspensionsAction,
  liftSuspensionAction,
  markSuspensionRequestAsCheckedAction,
  suspendEntityAction,
} from './actions';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu';
import { Button } from '@ui/components/button';
import { MoreHorizontalIcon } from 'lucide-react';
import { SuspensionRequestOverview } from '@shared/suspension/suspension-service';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function SuspensionListView() {
  const [suspensions, setSuspensions] = useState<SuspensionRequestOverview[]>([]);

  async function fetchSuspensions() {
    const result = await getSuspensionsAction();
    if (result.success) {
      setSuspensions(result.value);
    } else {
      toast.error(result.error.message);
    }
  }

  useEffect(() => {
    const loadSuspensions = async () => {
      await fetchSuspensions();
    };

    loadSuspensions();
  }, []);

  function mapEntityTypeToLabel(entityType: SuspensionRequestOverview['entityType']) {
    switch (entityType) {
      case 'assistant':
        return 'Assistent';
      case 'character':
        return 'Dialogpartner';
      case 'learningScenario':
        return 'Lernszenario';
      default:
        return entityType;
    }
  }

  function mapReasonToLabel(reason: SuspensionRequestOverview['reasons'][number]['reason']) {
    switch (reason) {
      case 'copyright_violation':
        return 'Urheberrechtsverletzung';
      case 'discrimination':
        return 'Diskriminierung';
      case 'false_or_outdated_information':
        return 'Falsche oder veraltete Informationen';
      case 'insufficient_sources':
        return 'Unzureichende Quellenangaben';
      case 'other':
        return 'Sonstiges';
      case 'personal_data_usage_or_query':
        return 'Nutzung oder Abfrage persönlicher Daten';
      case 'sexualized_content':
        return 'Sexualisierte Inhalte';
      case 'violence_or_extremist_content':
        return 'Gewalt / extremistische Inhalte';
      default:
        return reason;
    }
  }

  function canMarkAsChecked(suspension: SuspensionRequestOverview) {
    return suspension.status === 'new';
  }

  async function handleMarkAsChecked(suspensionRequestId: string) {
    const result = await markSuspensionRequestAsCheckedAction(suspensionRequestId);
    if (!result.success) {
      toast.error(result.error.message);
    }
    void fetchSuspensions();
  }

  function canLiftSuspension(suspension: SuspensionRequestOverview) {
    return suspension.status === 'suspended';
  }

  async function handleLiftSuspension(suspension: SuspensionRequestOverview) {
    const params = {
      assistantId: suspension.entityType === 'assistant' ? suspension.entityId : undefined,
      characterId: suspension.entityType === 'character' ? suspension.entityId : undefined,
      learningScenarioId:
        suspension.entityType === 'learningScenario' ? suspension.entityId : undefined,
    };
    const result = await liftSuspensionAction(params);
    if (!result.success) {
      toast.error(result.error.message);
    }
    void fetchSuspensions();
  }

  function canSuspendEntity(suspension: SuspensionRequestOverview) {
    return suspension.status === 'new' || suspension.status === 'checked';
  }

  async function handleSuspendEntity(suspension: SuspensionRequestOverview) {
    const params = {
      assistantId: suspension.entityType === 'assistant' ? suspension.entityId : undefined,
      characterId: suspension.entityType === 'character' ? suspension.entityId : undefined,
      learningScenarioId:
        suspension.entityType === 'learningScenario' ? suspension.entityId : undefined,
    };
    const result = await suspendEntityAction(params);
    if (!result.success) {
      toast.error(result.error.message);
    }
    void fetchSuspensions();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sperranfragen</CardTitle>
        <CardDescription>
          Liste aller Sperranfragen für Assistenten, Dialogpartner und Lernszenarien.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Typ</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Letzte Anfrage</TableHead>
              <TableHead>Anzahl Anfragen</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suspensions.map((suspension) => (
              <React.Fragment key={suspension.entityId}>
                <TableRow key={suspension.entityId}>
                  <TableCell>{mapEntityTypeToLabel(suspension.entityType)}</TableCell>
                  <TableCell>{suspension.entityName}</TableCell>
                  <TableCell>{suspension.latestRequestAt.toLocaleString()}</TableCell>
                  <TableCell>{suspension.requestCount}</TableCell>
                  <TableCell>{suspension.status}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {canSuspendEntity(suspension) && (
                          <DropdownMenuItem onClick={() => handleSuspendEntity(suspension)}>
                            sperren
                          </DropdownMenuItem>
                        )}
                        {canLiftSuspension(suspension) && (
                          <DropdownMenuItem onClick={() => handleLiftSuspension(suspension)}>
                            freigeben
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {suspension.reasons.map((reason, index) => (
                  <TableRow key={`${suspension.entityId}-reason-${index}`}>
                    <TableCell colSpan={5}>{mapReasonToLabel(reason.reason)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontalIcon />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {canMarkAsChecked(suspension) && (
                            <DropdownMenuItem onClick={() => handleMarkAsChecked(reason.id)}>
                              gelesen
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={6}>{`Gesamt: ${suspensions.length}`}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
