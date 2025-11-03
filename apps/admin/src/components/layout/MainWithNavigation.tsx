import Link from 'next/link';

export type NavItem = {
  label: string;
  href: string;
};

export type MainWithNavigationProps = {
  children: React.ReactNode;
  navItems: NavItem[];
};

export function MainWithNavigation({ navItems, children }: MainWithNavigationProps) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-8">
      {children}
      <div className="border rounded-xl p-6 h-fit">
        <div className="flex flex-col gap-2">
          <div className="text-sm text-stone-500 tracking-widest uppercase">NAVIGATION</div>
          {navItems.map((item, index) => (
            <Link key={'nav-item-' + index} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
