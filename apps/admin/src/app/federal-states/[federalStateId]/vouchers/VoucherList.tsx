'use client';
import React from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { Voucher } from '../../../../types/voucher';
import { revokeVoucher } from '../../../../services/voucher-service';
import { Button } from '@ui/components/Button';

export default function VoucherList({
  vouchers,
  username,
}: {
  vouchers: Voucher[];
  username?: string;
}) {
  const handleRevoke = async (voucher: Voucher) => {
    if (!username) {
      alert('Widerrufen abgebrochen: Benutzername nicht gefunden.');
      return;
    }
    const reason = prompt('Bitte Grund für das Widerrufen des Codes angeben:');
    if (!reason || reason.trim().length === 0) {
      alert('Widerrufen abgebrochen: Grund ist erforderlich.');
      return;
    }
    try {
      await revokeVoucher(voucher.code, voucher.federalStateId, username, reason);
      // update voucher list
      voucher.status = 'revoked';
      vouchers.find((v) => v.code === voucher.code)!.status = 'revoked';
    } catch (err) {
      alert('Fehler beim Widerrufen des Gutscheins: ' + (err as Error).message);
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
              {voucher.status === 'created' && username && (
                <Button onClick={() => handleRevoke(voucher)}>X</Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
