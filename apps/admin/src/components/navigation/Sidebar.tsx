import Link from 'next/link';

export type NavigationItem = {
  label: string;
  href: string;
};

export type NavigationSection = {
  title: string;
  items: NavigationItem[];
};

export type SidebarProps = {
  sections: NavigationSection[];
};

export function Sidebar({ sections }: SidebarProps) {
  return (
    <div className="flex flex-col gap-8 w-[240px] p-4">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="text-sm">{section.title}</div>
          {section.items.map((item) => (
            <Link key={item.label} href={item.href} className="block mt-2">
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
