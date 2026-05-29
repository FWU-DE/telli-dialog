'use client';

import { SuspensionRequestOverview } from '@shared/suspension/suspension-service';
import { columns } from './columns';
import { DataTable } from '@ui/components/data-table';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { type ColumnFiltersState } from '@tanstack/react-table';
import { Input } from '@ui/components/input';
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
import { ROUTES } from '@/consts/routes';

export default function SuspendedEntitiesOverview() {
  const [suspendedEntites, setSuspendedEntities] = useState<SuspensionRequestOverview[]>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
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
    router.push(ROUTES.app.suspensionDetails(row.entityType, row.entityId));
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
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Nach Name filtern"
              value={(columnFilters.find((f) => f.id === 'entityName')?.value as string) ?? ''}
              onChange={(e) => setColumnFilters([{ id: 'entityName', value: e.target.value }])}
              className="max-w-sm"
            />
            <DataTable
              columns={columns}
              data={suspendedEntites}
              rowClickHandler={handleRowClicked}
              columnFilters={columnFilters}
              onColumnFiltersChange={setColumnFilters}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
