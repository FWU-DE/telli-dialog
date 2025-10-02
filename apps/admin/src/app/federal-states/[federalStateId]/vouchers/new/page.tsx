import React from 'react';
import VoucherCreateView from './VoucherCreateView';
import { auth } from '../../../../api/auth/[...nextauth]/auth';

export const NEW_VOUCHER_ROUTE = '/federal-states/{federalStateId}/vouchers/new';

export default async function Page({ params }: { params: Promise<{ federalStateId: string }> }) {
  const federalStateId = (await params).federalStateId;
  const session = await auth();
  if (
    session === null ||
    session.user === undefined ||
    session.user.name === undefined ||
    session.user.name === null
  ) {
    throw new Error('User not found');
  }
  return (
    <div>
      <VoucherCreateView federalStateId={federalStateId} username={session.user.name} />
    </div>
  );
}
