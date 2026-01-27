import { getHostByHeaders } from '@/utils/host';
import Link from 'next/link';
import { IMPRESSUM_URL, PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from './const';

export default async function Footer() {
  const baseUrl = await getHostByHeaders();

  return (
    <footer className="flex gap-4 flex-wrap text-vidis-hover-purple w-full my-4 sm:my-8">
      <span>{baseUrl}</span>
      <div className="flex-grow" />
      <Link href={PRIVACY_POLICY_URL} prefetch={false} className="hover:underline">
        Datenschutz
      </Link>
      <Link href={IMPRESSUM_URL} prefetch={false} className="hover:underline">
        Impressum
      </Link>
      <Link href={TERMS_OF_USE_URL} prefetch={false} className="hover:underline">
        Nutzungsbedingungen
      </Link>
    </footer>
  );
}
