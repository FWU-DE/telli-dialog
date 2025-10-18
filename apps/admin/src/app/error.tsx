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
      {error.name && <pre>Name: {error.name}</pre>}
      {error.message && <pre>Message: {error.message}</pre>}
      {error.stack && <pre>Stack: {error.stack}</pre>}
    </div>
  );
}
