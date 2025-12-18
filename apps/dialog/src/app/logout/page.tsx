'use client';

import React from 'react';

export default function Logout() {
  React.useEffect(() => {
    window.location.assign('/api/auth/logout');
  }, []);

  return null;
}
