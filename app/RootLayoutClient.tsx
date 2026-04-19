'use client';

import { ThemeProvider } from '@lib/ThemeProvider';
import ServiceWorkerRegister from '@components/ServiceWorkerRegister';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceWorkerRegister />
      {children}
    </ThemeProvider>
  );
}