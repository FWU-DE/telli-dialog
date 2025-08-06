import Link from 'next/link';
import { Menubar } from '../menu/Menubar';
import { SignOutButton } from '../authentication/sign-out-button';

export function Header() {
  return (
    <header className="flex p-0 gap-6 items-center">
      <Link href="/" className="flex-none">
        <span className="text-xl font-bold">telli-admin</span>
      </Link>
      <div className="flex-1">
        <Menubar />
      </div>
      <div className="flex-none">
        <SignOutButton />
      </div>
    </header>
  );
}
