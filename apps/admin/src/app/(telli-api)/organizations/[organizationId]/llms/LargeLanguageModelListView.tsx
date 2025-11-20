'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { Checkbox } from '@ui/components/Checkbox';
import { getLargeLanguageModelsAction } from './actions';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState } from 'react';
import type { LargeLanguageModel } from '@/types/large-language-model';

export type LargeLanguageModelListViewProps = {
  organizationId: string;
  initialData: LargeLanguageModel[];
};

export function LargeLanguageModelListView({
  organizationId,
  initialData,
}: LargeLanguageModelListViewProps) {
  const [languageModels, setLanguageModels] = useState<LargeLanguageModel[]>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshedData = await getLargeLanguageModelsAction(organizationId);
      setLanguageModels(refreshedData);
    } catch (error) {
      console.error('Failed to refresh language models:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprachmodelle</CardTitle>
        <CardDescription>
          Liste aller verfügbaren Sprachmodelle für diese Organisation.
        </CardDescription>
        <CardAction>
          <Link href={`/organizations/${organizationId}/llms/new`}>
            <Button>Neues Modell</Button>
          </Link>
          <Button className="ml-2" onClick={handleRefresh} disabled={isRefreshing}>
            Aktualisieren
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Anbieter</TableHead>
              <TableHead>Beschreibung</TableHead>
              <TableHead className="text-center">Neu</TableHead>
              <TableHead className="text-center">Gelöscht</TableHead>
              <TableHead>Erstellt am</TableHead>
              <TableHead className="w-12">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {languageModels.map((model) => (
              <TableRow key={model.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{model.displayName || model.name}</div>
                    {model.displayName && model.displayName !== model.name && (
                      <div className="text-sm text-gray-500">{model.name}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {model.provider}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate" title={model.description}>
                    {model.description || '-'}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={model.isNew} disabled />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox checked={model.isDeleted} disabled />
                </TableCell>
                <TableCell>{new Date(model.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <Link href={`/organizations/${organizationId}/llms/${model.id}`}>
                    <Search className="text-primary" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
