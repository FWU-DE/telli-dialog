'use client';

import { signOut } from 'next-auth/react';
import React from 'react';

export default function Logout() {
  React.useEffect(() => {
    signOut();
  }, []);

  return null;
}
