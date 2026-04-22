'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@ui/components/Button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@ui/components/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { ROUTES } from '@/consts/routes';
import { getInfoBannersAction } from './actions';
import type { InfoBanner } from '@shared/info-banners/info-banner';

function getTypeLabel(type: InfoBanner['type']) {
  return type === 'warning' ? 'Warnung' : 'Information';
}

function truncateMessage(message: string) {
  if (message.length <= 90) {
    return message;
  }

  return `${message.slice(0, 87)}...`;
}

export default function InfoBannerListView() {
  const [infoBanners, setInfoBanners] = useState<InfoBanner[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function loadInfoBanners() {
    startTransition(async () => {
      try {
        setError(null);
        const loadedInfoBanners = await getInfoBannersAction();
        setInfoBanners(loadedInfoBanners);
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : 'Ein unbekannter Fehler ist aufgetreten.';
        setError(message);
        toast.error(`Fehler beim Laden der Info-Banner: ${message}`);
      }
    });
  }

  useEffect(() => {
    loadInfoBanners();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Info-Banner</CardTitle>
        <CardDescription>
          Liste aller Info- und Warnbanner für telli-dialog.
        </CardDescription>
        <CardAction>
          <Link href={ROUTES.dialog.infoBannerNew}>
            <Button>Neues Info-Banner</Button>
          </Link>
          <Button disabled={isPending} onClick={loadInfoBanners} className="ml-2">
            {isPending ? 'Lädt...' : 'Aktualisieren'}
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
              <TableHead>Typ</TableHead>
              <TableHead>Nachricht</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Ende</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {infoBanners.map((infoBanner) => (
              <TableRow key={infoBanner.id}>
                <TableCell>{getTypeLabel(infoBanner.type)}</TableCell>
                <TableCell>{truncateMessage(infoBanner.message)}</TableCell>
                <TableCell>{infoBanner.startsAt.toLocaleString()}</TableCell>
                <TableCell>{infoBanner.endsAt.toLocaleString()}</TableCell>
                <TableCell>
                  <Link
                    href={ROUTES.dialog.infoBannerDetails(infoBanner.id)}
                    aria-label={`Details für ${getTypeLabel(infoBanner.type)}-Banner anzeigen`}
                  >
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
