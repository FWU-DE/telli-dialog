'use client';
import React from 'react';
import { Voucher } from '../../../../types/voucher';

import { Button } from '../../../../components/common/Button';
import Link from 'next/link';
import VoucherList from '../../../../components/vouchers/VoucherList';

export default function VoucherListView({
  vouchers,
  username,
}: {
  vouchers: Voucher[];
  username: string | undefined;
}) {
  return (
    <div>
      <div className="flex items-center justify-between w-full gap-4 mb-4">
        <h1>Guthaben Codes Übersicht</h1>
        <Link href="vouchers/new">
          <Button>Neue erstellen</Button>
        </Link>
      </div>
      <VoucherList vouchers={vouchers} username={username} />
    </div>
  );
}
