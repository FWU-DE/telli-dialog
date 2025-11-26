'use client';
import React from 'react';
import { VoucherModel } from '@telli/shared/vouchers/voucher';
import { Button } from '@ui/components/Button';
import Link from 'next/link';
import VoucherList from './VoucherList';
import { ROUTES } from '../../../../../consts/routes';

export default function VoucherListView({
  vouchers,
  username,
  federalStateId,
}: {
  vouchers: VoucherModel[];
  username: string | undefined;
  federalStateId: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between w-full gap-4 mb-4">
        <h1>Guthaben Codes Übersicht</h1>
        <Link href={ROUTES.dialog.voucherNew(federalStateId)}>
          <Button>Neue erstellen</Button>
        </Link>
      </div>
      <VoucherList vouchers={vouchers} username={username} />
    </div>
  );
}
