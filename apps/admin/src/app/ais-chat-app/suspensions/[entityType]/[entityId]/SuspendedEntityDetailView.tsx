'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@ui/components/card';
import { mapEntityTypeToLabel } from '../../utils';
import { EntityType, SuspensionRequestOverview } from '@shared/suspension/suspension-service';
import { Button } from '@ui/components/button';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { SuspensionRequestSelectModel } from '@shared/db/schema';
import Link from 'next/link';
import {
  getSuspendedItemWithDetailsAction,
  liftSuspensionAction,
  markSuspensionRequestAsCheckedAction,
  suspendEntityAction,
} from '../../actions';
import { toast } from 'sonner';
import { Skeleton } from '@ui/components/skeleton';
import { SuspensionRequestItem } from './SuspensionRequestItem';

type SuspendedEntityDetailViewProps = {
  entityType: EntityType;
  entityId: string;
  chatBotEntityUrl: string;
};

export function SuspendedEntityDetailView({
  entityType,
  entityId,
  chatBotEntityUrl,
}: SuspendedEntityDetailViewProps) {
  const [suspendedItemDetails, setSuspendedItemDetails] = useState<SuspensionRequestOverview>();
  const [suspensionRequests, setSuspensionRequests] = useState<SuspensionRequestSelectModel[]>([]);
  const [isPending, startTransition] = useTransition();

  const loadData = useCallback(async () => {
    startTransition(async () => {
      const result = await getSuspendedItemWithDetailsAction({ entityType, entityId });
      if (result.success) {
        setSuspensionRequests(result.value.requests);
        setSuspendedItemDetails(result.value.suspendedItem);
      } else {
        toast.error(result.error.message);
      }
    });
  }, [entityType, entityId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function canMarkAsChecked() {
    return suspendedItemDetails?.status === 'new';
  }

  async function handleMarkAsChecked(suspensionRequestId: string) {
    const result = await markSuspensionRequestAsCheckedAction(suspensionRequestId);
    if (!result.success) {
      toast.error(result.error.message);
    }
    void loadData();
  }

  function canLiftSuspension() {
    return suspendedItemDetails?.status === 'suspended';
  }

  async function handleLiftSuspension() {
    const params = {
      assistantId:
        suspendedItemDetails?.entityType === 'assistant'
          ? suspendedItemDetails?.entityId
          : undefined,
      characterId:
        suspendedItemDetails?.entityType === 'character'
          ? suspendedItemDetails?.entityId
          : undefined,
      learningScenarioId:
        suspendedItemDetails?.entityType === 'learningScenario'
          ? suspendedItemDetails?.entityId
          : undefined,
    };
    const result = await liftSuspensionAction(params);
    if (!result.success) {
      toast.error(result.error.message);
    }
    void loadData();
  }

  function canSuspendEntity() {
    return suspendedItemDetails?.status === 'new' || suspendedItemDetails?.status === 'checked';
  }

  async function handleSuspendEntity() {
    const params = {
      assistantId:
        suspendedItemDetails?.entityType === 'assistant'
          ? suspendedItemDetails?.entityId
          : undefined,
      characterId:
        suspendedItemDetails?.entityType === 'character'
          ? suspendedItemDetails?.entityId
          : undefined,
      learningScenarioId:
        suspendedItemDetails?.entityType === 'learningScenario'
          ? suspendedItemDetails?.entityId
          : undefined,
    };
    const result = await suspendEntityAction(params);
    if (!result.success) {
      toast.error(result.error.message);
    }
    void loadData();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meldungen</CardTitle>
        <CardDescription>
          <div>
            Liste aller Meldungen für {mapEntityTypeToLabel(entityType)} mit ID {entityId}
          </div>
          <Link
            href={chatBotEntityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4"
          >
            In AIS.chat öffnen
          </Link>
        </CardDescription>
        <CardAction className="flex gap-2">
          <Button
            variant="destructive"
            disabled={!canSuspendEntity()}
            onClick={handleSuspendEntity}
          >
            Sperren
          </Button>
          <Button disabled={!canLiftSuspension()} onClick={handleLiftSuspension}>
            Entsperren
          </Button>
        </CardAction>
      </CardHeader>
      {isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
          <Skeleton className="h-10 w-1/4" />
        </div>
      ) : (
        <CardContent className="flex flex-col gap-4">
          {suspensionRequests.map((request) => {
            return (
              <SuspensionRequestItem
                key={request.id}
                request={request}
                canMarkAsChecked={canMarkAsChecked()}
                onMarkAsChecked={handleMarkAsChecked}
              />
            );
          })}
        </CardContent>
      )}
    </Card>
  );
}
