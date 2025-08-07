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
      <h2>Ein Fehler ist aufgetreten!</h2>
      <span>{error.message}</span>
    </div>
  );
}
