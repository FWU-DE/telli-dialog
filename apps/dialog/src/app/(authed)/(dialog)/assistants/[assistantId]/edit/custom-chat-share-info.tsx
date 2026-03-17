import Link from 'next/link';

export function CustomChatShareInfo({ href }: { href: string }) {
  return (
    <div className="flex px-6 py-4 justify-between text-base font-medium rounded-xl bg-secondary/40">
      <span className="">Dieser Assistent ist für andere freigegeben.</span>
      <Link href={href}>
        <span className="text-primary">Freigabe-Einstellungen</span>
      </Link>
    </div>
  );
}
