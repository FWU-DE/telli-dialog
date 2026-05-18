import { Skeleton } from '@ui/components/skeleton';

export default function Loading() {
  return (
    <div className="flex gap-4">
      <Skeleton className="h-16 w-[100px] rounded" />
      <Skeleton className="h-16 w-[100px] rounded" />
      <Skeleton className="h-16 w-[100px] rounded" />
    </div>
  );
}
