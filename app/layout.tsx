import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import RootLayoutClient from './RootLayoutClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Goalyx',
  description: 'Motor de hábitos, eventos y score diario con módulos extendibles.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'manifest', url: '/site.webmanifest' }
    ]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
