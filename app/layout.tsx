import { ClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata = { title: 'Agency Projects', description: 'Agency project management dashboard' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en"><body>{children}</body></html>
    </ClerkProvider>
  );
}
