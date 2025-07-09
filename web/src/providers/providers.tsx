'use client';

import { type ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryProvider } from './query-provider';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Toaster } from '@/components/deer-flow/toaster';

interface ProvidersProps {
  children: ReactNode;
  initialCookies: { name: string; value: string }[];
}

export function Providers({ children, initialCookies }: ProvidersProps) {
  // Initialize cookies in client-side
  if (typeof window !== 'undefined' && !window.__INITIAL_COOKIES__) {
    window.__INITIAL_COOKIES__ = initialCookies;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
} 