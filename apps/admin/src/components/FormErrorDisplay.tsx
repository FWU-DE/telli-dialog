import React from 'react';
import { FieldErrors } from 'react-hook-form';

export type FormErrorDisplayProps = {
  errors: FieldErrors;
};

const getErrorMessage = (error: FieldErrors[string]): string => {
  if (!error) return '';
  if (typeof error.message === 'string') {
    return error.message;
  }
  return error.message?.message?.toString() ?? '';
};

export function FormErrorDisplay({ errors }: FormErrorDisplayProps) {
  if (Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <p className="font-medium">Bitte korrigieren Sie die folgenden Fehler:</p>
      <ul className="list-disc list-inside mt-2">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>{getErrorMessage(error as FieldErrors[string])}</li>
        ))}
      </ul>
    </div>
  );
}
