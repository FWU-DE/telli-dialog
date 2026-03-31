import { DialogHeaderProvider } from '@/components/providers/dialog-header-provider';
import UnauthDialogHeaderSlot from './dialog-header-slot';

export default function UnauthSharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <DialogHeaderProvider>
      <div className="flex flex-col h-dvh w-full">
        <UnauthDialogHeaderSlot />
        <div className="flex-1 min-h-0">{children}</div>
      </div>
    </DialogHeaderProvider>
  );
}
