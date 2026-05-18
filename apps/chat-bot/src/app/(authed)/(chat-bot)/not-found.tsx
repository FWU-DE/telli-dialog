import { WarningIcon } from '@phosphor-icons/react/dist/ssr';
import * as React from 'react';

export default function NotFound() {
  return (
    <div className="flex justify-center">
      <div className="p-6 flex flex-col gap-4 items-center rounded-xl border bg-light-gray max-w-fit">
        <WarningIcon className="size-12 text-primary" aria-hidden="true" />
        <span>Diese Ressource existiert nicht oder ist nicht freigegeben.</span>
      </div>
    </div>
  );
}
