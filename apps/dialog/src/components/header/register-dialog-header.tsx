'use client';

import React from 'react';
import { useRegisterDialogHeader } from '@/components/providers/dialog-header-provider';

export default function RegisterDialogHeader({ children }: { children: React.ReactNode }) {
  useRegisterDialogHeader(children);

  return null;
}
