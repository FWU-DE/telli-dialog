import React from 'react';
import VoucherCreateView from './VoucherCreateView';
import { auth } from '@/auth';

export default async function Page(
  props: PageProps<'/telli-dialog/federal-states/[federalStateId]/vouchers/new'>,
) {
  const { federalStateId } = await props.params;
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
      <VoucherCreateView federalStateId={federalStateId} />
    </div>
  );
}
