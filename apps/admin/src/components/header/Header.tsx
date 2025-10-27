import Link from 'next/link';
import { SignOutButton } from '../authentication/SignOutButton';
import { HOME_ROUTE } from '../../app/page';

export function Header() {
  return (
    <header className="flex px-4 gap-6 items-center">
      <Link href={HOME_ROUTE} className="flex-none">
        <span className="text-xl font-bold">telli-admin</span>
      </Link>
      <div className="flex-1"></div>
      <div className="flex-none">
        <SignOutButton />
      </div>
    </header>
  );
}
