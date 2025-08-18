import CredentialForm from './component';
import { getCsrfToken } from 'next-auth/react';

export const dynamic = 'force-dynamic';
export default async function Page() {
  return (
    <div className="h-[100dvh] flex flex-col gap-4 sm:gap-8">
      <CredentialForm />
    </div>
  );
}
