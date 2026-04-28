'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@components/Navigation';
import ModuleTile from '@components/ModuleTile';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import type { Module } from '@types';

export const dynamic = 'force-dynamic';

export default function ModulesSettingsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseSession();
  const supabase = createBrowserSupabaseClient();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;

    async function loadModules() {
      try {
        const res = await fetch('/api/modules', { credentials: 'include' });
        if (!res.ok) throw new Error('Error loading modules');
        const data = await res.json();
        setModules(data);
      } catch (error) {
        console.error('Error loading modules:', error);
      } finally {
        setLoading(false);
      }
    }

    loadModules();
  }, [sessionLoading, session]);

  const handleToggleModule = async (moduleId: string, active: boolean) => {
    try {
      const res = await fetch(`/api/modules/${moduleId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (res.ok) {
        setModules(modules.map(m => m.id === moduleId ? { ...m, active } : m));
      } else {
        throw new Error('Error toggling module');
      }
    } catch (error) {
      console.error('Error toggling module:', error);
      alert('Error al cambiar el módulo');
    }
  };

  if (sessionLoading || loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          <Navigation />
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Módulos</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">Configura tus módulos</p>
            </div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-4xl">
        <Navigation />
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Módulos</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Activa y configura tus módulos</p>
          </div>
          <button
            onClick={() => router.push('/settings')}
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <span>←</span> Volver
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
            Activa módulos adicionales para funcionalidades extra. Cada módulo añade nuevas opciones de seguimiento y registro.
          </p>
          
          {modules.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">No hay módulos disponibles</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <ModuleTile
                  key={module.id}
                  module={module}
                  onToggle={handleToggleModule}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}