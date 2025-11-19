'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getFederalStatesAction } from './actions';
import { CreateFederalStateModal } from './CreateFederalStateModal';
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
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '../../../consts/routes';
import { FederalStateModel } from '@shared/types/federal-state';

export default function FederalStateListView() {
  const [federalStates, setFederalStates] = useState<FederalStateModel[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadFederalStates();
  }, []);

  const loadFederalStates = async () => {
    startTransition(async () => {
      try {
        setError(null);
        const fetchedFederalStates = await getFederalStatesAction();
        setFederalStates(fetchedFederalStates);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten.';
        setError(errorMessage);
        toast.error(`Fehler beim Laden der Bundesländer: ${errorMessage}`);
      }
    });
  };

  const handleRefresh = () => {
    loadFederalStates();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bundesländer</CardTitle>
          <CardDescription>Liste aller Bundesländer im System.</CardDescription>
          <CardAction>
            <Button onClick={() => setIsCreateModalOpen(true)} disabled={isPending}>
              Neues Bundesland
            </Button>
            <Button disabled={isPending} onClick={handleRefresh}>
              {isPending ? 'Lädt...' : 'Aktualisieren'}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Id</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Erstellt am</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {federalStates.map((federalState) => (
                <TableRow key={federalState.id}>
                  <TableCell>{federalState.id}</TableCell>
                  <TableCell>{federalState.telliName}</TableCell>
                  <TableCell>{federalState.createdAt.toLocaleString()}</TableCell>
                  <TableCell>
                    <Link href={ROUTES.dialog.federalStateDetails(federalState.id)}>
                      <Search className="text-primary" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <CreateFederalStateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </>
  );
}
