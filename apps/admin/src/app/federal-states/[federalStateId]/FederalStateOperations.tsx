import Link from 'next/link';

export type FederalStateOperationsProps = {
  federalStateId: string;
};

export function FederalStateOperations({ federalStateId }: FederalStateOperationsProps) {
  return (
    <div className="border rounded-xl p-6 h-fit">
      <div className="flex flex-col gap-2">
        <span className="text-sm text-stone-500 tracking-widest uppercase">Operationen</span>
        <Link href={`/federal-states/${federalStateId}`}>Einstellungen</Link>
        <Link href={`/federal-states/${federalStateId}/api-key`}>API Key aktualisieren</Link>
        <Link href={`/federal-states/${federalStateId}/vouchers`}>Guthaben Codes</Link>
      </div>
    </div>
  );
}
