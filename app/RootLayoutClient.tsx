'use client';

import { ThemeProvider } from '@lib/ThemeProvider';
import ServiceWorkerRegister from '@components/ServiceWorkerRegister';

export default function RootLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceWorkerRegister />
      <div className="min-h-screen pb-24 pt-20 sm:pb-0 sm:pt-0">
        {children}
      </div>
    </ThemeProvider>
  );
}
