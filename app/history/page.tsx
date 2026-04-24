'use client';

import HistoryViewer from '@components/HistoryViewer';
import Navigation from '@components/Navigation';

export default function HistoryPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />

        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Historial de Registros</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Revisa y edita tus registros de días pasados.
          </p>
        </header>

        <div className="space-y-6">
          <HistoryViewer />
        </div>
      </div>
    </main>
  );
}
