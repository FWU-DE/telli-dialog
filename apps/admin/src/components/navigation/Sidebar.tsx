import { Separator } from '@ui/components/Separator';
import Link from 'next/link';

export function Sidebar() {
  return (
    <div className="w-[240px] h-full p-4">
      <div className="text-sm">telli-api</div>
      <Link href="/organizations" className="block mt-2">
        Organisationen
      </Link>
      <Link href="/llms" className="block mt-2">
        Modelle
      </Link>
      <Separator className="my-8" />
      <div className="text-sm">telli-dialog</div>
      <Link href="/federal-states" className="block mt-2">
        Bundesländer
      </Link>
      <Link href="/vouchers" className="block mt-2">
        Guthaben Codes
      </Link>
    </div>
  );
}
