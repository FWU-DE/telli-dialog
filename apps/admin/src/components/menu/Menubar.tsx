import { MenubarItem } from './MenubarItem';

export function Menubar() {
  return (
    <nav className="flex left-0">
      <MenubarItem label="telli-api" href="/projects" />
      <MenubarItem label="telli-dialog" href="/federal-states" />
    </nav>
  );
}
