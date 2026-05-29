'use client';

import { SuspensionRequestOverview } from '@shared/suspension/suspension-service';
import { columns } from './columns';
import { DataTable } from '@ui/components/data-table';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { getSuspendedEntitiesAction } from './actions';
import { toast } from 'sonner';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/card';
import { Button } from '@ui/components/button';
import { Skeleton } from '@ui/components/skeleton';

export default function SuspendedEntitiesOverview() {
  const [suspendedEntites, setSuspendedEntities] = useState<SuspensionRequestOverview[]>([]);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function loadData() {
    startTransition(async () => {
      const result = await getSuspendedEntitiesAction();
      if (result.success) {
        setSuspendedEntities(result.value);
      } else {
        toast.error(result.error.message);
      }
    });
  }

  useEffect(() => {
    void loadData();
  }, []);

  const handleRefresh = () => {
    void loadData();
  };

  function handleRowClicked(row: SuspensionRequestOverview): void {
    router.push(`/ais-chat-app/suspensions/${row.entityType}/${row.entityId}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gemeldete Inhalte</CardTitle>
        <CardDescription>Übersicht aller gemeldeten Inhalte (AS/DP/LS).</CardDescription>
        <CardAction>
          <Button disabled={isPending} onClick={handleRefresh} className="ml-2">
            {isPending ? 'Lädt...' : 'Aktualisieren'}
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-full rounded" />
          </div>
        ) : (
          <DataTable columns={columns} data={suspendedEntites} rowClickHandler={handleRowClicked} />
        )}
      </CardContent>
    </Card>
  );
}
