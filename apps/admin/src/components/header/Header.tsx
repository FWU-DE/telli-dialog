import Link from 'next/link';
import { SignOutButton } from '../authentication/SignOutButton';
import { ROUTES } from '../../consts/routes';

export function Header() {
  return (
    <header className="flex gap-6 items-center">
      <Link href={ROUTES.home} className="flex-none">
        <span className="text-xl font-bold">telli-admin</span>
      </Link>
      <div className="flex-1 flex flex-row gap-4">
        <Link href={ROUTES.api.organizations}>telli-api</Link>
        <Link href={ROUTES.dialog.federalStates}>telli-dialog</Link>
      </div>
      <div className="flex-none">
        <SignOutButton />
      </div>
    </header>
  );
}
