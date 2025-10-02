import React from 'react';
import NewVoucherFormView from './NewVoucherFormView';
import { auth } from '../../../../api/auth/[...nextauth]/auth';

export default async function Page({ params }: { params: Promise<{ federalStateId: string }> }) {
  const federalStateId = (await params).federalStateId;
  const session = await auth();
  if (
    session === null ||
    session.user === undefined ||
    session.user.name === undefined ||
    session.user.name === null
  ) {
    throw new Error('Not authenticated');
  }
  return (
    <div>
      <NewVoucherFormView federalStateId={federalStateId} username={session.user.name} />
    </div>
  );
}
