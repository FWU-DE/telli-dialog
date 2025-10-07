'use client';
import React from 'react';
import { Voucher } from '../../../../types/voucher';

import { Button } from '@ui/components/Button';
import Link from 'next/link';
import VoucherList from './VoucherList';
import { NEW_VOUCHER_ROUTE } from './new/page';

export default function VoucherListView({
  vouchers,
  username,
  federalStateId,
}: {
  vouchers: Voucher[];
  username: string | undefined;
  federalStateId: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between w-full gap-4 mb-4">
        <h1>Guthaben Codes Übersicht</h1>
        <Link href={NEW_VOUCHER_ROUTE.replace('{federalStateId}', federalStateId)}>
          <Button>Neue erstellen</Button>
        </Link>
      </div>
      <VoucherList vouchers={vouchers} username={username} />
    </div>
  );
}
