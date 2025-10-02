'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h1>Ein Fehler ist aufgetreten!</h1>
      <span>{error.message}</span>
    </div>
  );
}
