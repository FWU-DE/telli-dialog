'use client';
import React from 'react';
import { toast } from 'sonner';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { Voucher } from '@telli/shared/vouchers/voucher';
import { revokeVoucherAction } from './actions';
import { Button } from '@ui/components/Button';
import { BusinessError } from '@shared/error';

export default function VoucherList({ vouchers }: { vouchers: Voucher[] }) {
  const handleRevoke = async (voucher: Voucher) => {
    const reason = prompt('Bitte Grund für das Widerrufen des Codes angeben:');
    if (!reason || reason.trim().length === 0) {
      toast.error('Widerrufen abgebrochen: Grund ist erforderlich.');
      return;
    }
    try {
      await revokeVoucherAction(voucher.code, voucher.federalStateId, reason);
      // update voucher list
      voucher.status = 'revoked';
      vouchers.find((v) => v.code === voucher.code)!.status = 'revoked';
    } catch (err) {
      const errorMessage =
        err instanceof BusinessError ? err.message : 'Ein unbekannter Fehler ist aufgetreten';
      toast.error('Fehler beim Widerrufen des Gutscheins: ' + errorMessage);
    }
  };
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Betrag (in Cent)</TableHead>
          <TableHead>Dauer (in Monaten)</TableHead>
          <TableHead>Gültig bis</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead>Erstellt von</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => (
          <TableRow key={voucher.code}>
            <TableCell>{voucher.code}</TableCell>
            <TableCell>{voucher.increaseAmount}</TableCell>
            <TableCell>{voucher.durationMonths}</TableCell>
            <TableCell>{new Date(voucher.validUntil).toLocaleDateString('de-DE')}</TableCell>
            <TableCell>{new Date(voucher.createdAt).toLocaleDateString('de-DE')}</TableCell>
            <TableCell>{voucher.createdBy}</TableCell>
            <TableCell>
              {voucher.status}{' '}
              {voucher.status === 'created' && (
                <Button onClick={() => handleRevoke(voucher)}>X</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
