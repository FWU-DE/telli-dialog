import { logWarning } from '@shared/logging';
import { notFound } from 'next/navigation';
import z from 'zod';

export function parseSearchParams<T>(
  zodSchema: z.ZodType<T>,
  searchParams: Record<string, string | string[] | undefined>,
): T {
  try {
    return zodSchema.parse(searchParams);
  } catch (error) {
    logWarning('Failed to parse search params', { error, searchParams });
    notFound();
  }
}
