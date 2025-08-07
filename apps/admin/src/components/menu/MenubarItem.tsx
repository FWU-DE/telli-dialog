import { Button } from '@ui/components/button';
import Link from 'next/link';

export type MenubarItemProps = {
  label: string;
  href: string;
};

export function MenubarItem({ label, href }: MenubarItemProps) {
  return (
    <Button variant="link" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}
