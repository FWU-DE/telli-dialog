'use client';

import { SuspensionRequestOverview } from '@shared/suspension/suspension-service';
import { formatDateToGermanTimestamp } from '@shared/utils/date';
import { ColumnDef } from '@tanstack/react-table';
import { mapEntityTypeToLabel } from './utils';

export const columns: ColumnDef<SuspensionRequestOverview>[] = [
  {
    accessorKey: 'entityName',
    header: 'Name',
  },
  {
    accessorKey: 'entityType',
    header: 'Typ',
    cell: ({ row }) => {
      return mapEntityTypeToLabel(row.original.entityType);
    },
  },
  {
    accessorKey: 'latestRequestAt',
    header: 'Zuletzt gemeldet am',
    cell: ({ row }) => {
      return formatDateToGermanTimestamp(row.original.latestRequestAt);
    },
  },
  {
    accessorKey: 'requestCount',
    header: 'Anzahl Meldungen',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
];
