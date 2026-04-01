import Link from 'next/link';

export function CustomChatShareInfo({
  href,
  info,
  linkText,
}: {
  href: string;
  info: string;
  linkText: string;
}) {
  return (
    <div className="flex px-6 py-4 justify-between text-base font-medium rounded-xl bg-secondary/40">
      <span>{info}</span>
      <Link href={href}>
        <span className="text-primary">{linkText}</span>
      </Link>
    </div>
  );
}
