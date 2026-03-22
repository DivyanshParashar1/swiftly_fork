'use client';

import { SnackbarProvider } from 'notistack';
import type { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SnackbarProvider 
      maxSnack={3}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      autoHideDuration={4000}
      preventDuplicate
      style={{
        fontFamily: 'var(--font-geist-sans)',
      }}
    >
      {children}
    </SnackbarProvider>
  );
}
