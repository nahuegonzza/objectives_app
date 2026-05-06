'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@components/Navigation';
import { createBrowserSupabaseClient } from '@lib/supabase-client';
import { useSupabaseSession } from '@hooks/useSupabaseSession';
import ModuleOrderManager from '@components/ModuleOrderManager';
import type { Module } from '@types';
import { SleepConfig } from '../../../modules/sleep/SleepConfig';
import { MoodConfig } from '../../../modules/mood/MoodConfig';
import { AcademicConfig } from '@modules/academic/AcademicConfig';

export const dynamic = 'force-dynamic';

// Iconos para cada módulo
const moduleIcons: Record<string, string> = {
  sleep: '🌙',
  mood: '😊',
  water: '💧',
  habits: '✓',
  finance: '💰',
  gym: '🏋️',
  work: '💼',
  academic: '📚',
  goals: '🎯',
};

// Colores para cada módulo
const moduleColors: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  sleep: { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-700 dark:text-indigo-300', gradient: 'from-indigo-500 to-purple-600' },
  mood: { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-700 dark:text-amber-300', gradient: 'from-amber-500 to-orange-600' },
  water: { bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-700 dark:text-cyan-300', gradient: 'from-cyan-500 to-blue-600' },
  habits: { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-700 dark:text-emerald-300', gradient: 'from-emerald-500 to-teal-600' },
  finance: { bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800', text: 'text-green-700 dark:text-green-300', gradient: 'from-green-500 to-lime-600' },
  gym: { bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800', text: 'text-rose-700 dark:text-rose-300', gradient: 'from-rose-500 to-red-600' },
  work: { bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-300', gradient: 'from-slate-500 to-zinc-600' },
  academic: { bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-700 dark:text-blue-300', gradient: 'from-blue-500 to-sky-600' },
  goals: { bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', gradient: 'from-purple-500 to-fuchsia-600' },
};

export default function ModulesSettingsPage() {
  const router = useRouter();
  const { session, loading: sessionLoading } = useSupabaseSession();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [configModule, setConfigModule] = useState<Module | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  const [showOrderManager, setShowOrderManager] = useState(false);

  useEffect(() => {
    if (!showToast) return;
    const timer = setTimeout(() => setShowToast(false), 3000);
    return () => clearTimeout(timer);
  }, [showToast]);

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

  const handleConfigSave = async (newConfig: Record<string, unknown>) => {
    if (!configModule) return false;
    try {
      const res = await fetch(`/api/modules/${configModule.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
      if (res.ok) {
        const updatedModule = await res.json();
        setModules(modules.map(m => m.id === configModule.id ? updatedModule : m));
        setMessage('✓ Registrado');
        setMessageType('success');
        setShowToast(true);
        return true;
      }
      setMessage('Error al guardar la configuración');
      setMessageType('error');
      setShowToast(true);
      return false;
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('Error al guardar la configuración');
      setMessageType('error');
      setShowToast(true);
      return false;
    }
  };

  const activeModules = modules.filter(m => m.active);
  const inactiveModules = modules.filter(m => !m.active);

  if (sessionLoading || loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
        <div className="mx-auto max-w-4xl">
          <Navigation />
          <div className="mb-8 animate-pulse">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-lg mb-2"></div>
            <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
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
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Módulos</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">Personaliza tu experiencia</p>
          </div>
          <button
            onClick={() => setShowOrderManager(true)}
            className="rounded-lg bg-emerald-600 text-white px-4 py-2 font-medium hover:bg-emerald-700 transition"
          >
            Ordenar módulos
          </button>
        </div>

        {showToast && (
          <div className="fixed inset-x-0 top-24 z-50 flex justify-center px-4">
            <div className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg shadow-slate-900/10 ${messageType === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
              {message}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 text-white">
            <p className="text-3xl font-bold">{activeModules.length}</p>
            <p className="text-sm opacity-90">Activos</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-slate-500 to-slate-600 p-4 text-white">
            <p className="text-3xl font-bold">{inactiveModules.length}</p>
            <p className="text-sm opacity-90">Inactivos</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-4 text-white col-span-2">
            <p className="text-3xl font-bold">{modules.length}</p>
            <p className="text-sm opacity-90">Total de módulos</p>
          </div>
        </div>

        {/* Módulos activos */}
        {activeModules.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Módulos activos
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {activeModules.map((module) => {
                const colors = moduleColors[module.slug] || moduleColors.work;
                const icon = moduleIcons[module.slug] || '📦';
                return (
                  <article
                    key={module.id}
                    className={`relative overflow-hidden rounded-2xl border ${colors.border} ${colors.bg} p-5 transition hover:scale-[1.02] hover:shadow-lg`}
                  >
                    {/* Gradient accent */}
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${colors.gradient} opacity-10 rounded-bl-full`}></div>
                    
                    <div className="relative">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{icon}</span>
                          <div>
                            <h3 className={`font-semibold ${colors.text}`}>{module.name}</h3>
                            <span className="text-xs text-slate-500 dark:text-slate-400">{module.slug}</span>
                          </div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300`}>
                          Activo
                        </span>
                      </div>
                      
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                        {module.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {module.slug !== 'goals' && (
                          <button
                            type="button"
                            onClick={() => handleToggleModule(module.id, false)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
                          >
                            Desactivar
                          </button>
                        )}
                        {(module.slug === 'sleep' || module.slug === 'mood' || module.slug === 'academic') && (
                          <button
                            type="button"
                            onClick={() => setConfigModule(module)}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                          >
                            Configurar
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Módulos inactivos */}
        {inactiveModules.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Módulos disponibles
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {inactiveModules.map((module) => {
                const colors = moduleColors[module.slug] || moduleColors.work;
                const icon = moduleIcons[module.slug] || '📦';
                return (
                  <article
                    key={module.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-5 opacity-75 transition hover:opacity-100"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl grayscale">{icon}</span>
                        <div>
                          <h3 className="font-semibold text-slate-700 dark:text-slate-300">{module.name}</h3>
                          <span className="text-xs text-slate-500">{module.slug}</span>
                        </div>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        Inactivo
                      </span>
                    </div>
                    
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
                      {module.description}
                    </p>

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => handleToggleModule(module.id, true)}
                        className="w-full rounded-lg py-2 text-sm font-semibold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 transition"
                      >
                        Activar módulo
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {modules.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
            <span className="text-5xl">📦</span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No hay módulos</h3>
            <p className="mt-2 text-slate-600 dark:text-slate-400">No se encontraron módulos disponibles</p>
          </div>
        )}

        {/* Module Order Manager Modal */}
        {showOrderManager && (
          <ModuleOrderManager
            modules={modules.filter(m => m.active)}
            onClose={() => setShowOrderManager(false)}
            onOrderSaved={(orderUpdates) => {
              const orderMap = new Map(orderUpdates.map((item) => [item.id, item.order]));
              setModules((prev) =>
                [...prev].sort((a, b) => {
                  const aOrder = orderMap.has(a.id) ? orderMap.get(a.id)! : a.order ?? 0;
                  const bOrder = orderMap.has(b.id) ? orderMap.get(b.id)! : b.order ?? 0;
                  return aOrder - bOrder;
                })
              );
            }}
          />
        )}
      </div>

      {/* Config modals */}
      {configModule?.slug === 'sleep' && (
        <SleepConfig
          config={configModule.config || {}}
          onSave={handleConfigSave}
          onClose={() => setConfigModule(null)}
        />
      )}
      {configModule?.slug === 'mood' && (
        <MoodConfig
          config={configModule.config || {}}
          onSave={handleConfigSave}
          onClose={() => setConfigModule(null)}
        />
      )}
      {configModule?.slug === 'academic' && (
        <AcademicConfig
          config={configModule.config || {}}
          moduleId={configModule.id}
          moduleName={configModule.slug}
          onSave={handleConfigSave}
          onClose={() => setConfigModule(null)}
        />
      )}
    </main>
  );
}