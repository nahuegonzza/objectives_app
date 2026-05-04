import type { ModuleState } from '@types';
import { useState } from 'react';
import { SleepConfig } from '../modules/sleep/SleepConfig';
import { MoodConfig } from '../modules/mood/MoodConfig';
import { AcademicConfig } from '../modules/academic/AcademicConfig';

interface ModuleTileProps {
  module: ModuleState;
  onToggle?: (id: string, active: boolean) => void;
}

export default function ModuleTile({ module, onToggle }: ModuleTileProps) {
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigSave = async (newConfig: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/modules/${module.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: newConfig }),
      });
      if (res.ok) {
        // Optionally update local state
      }
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{module.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{module.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${module.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
          {module.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-300">slug: {module.slug}</span>
        {typeof onToggle === 'function' && (
          <button
            type="button"
            onClick={() => onToggle(module.id, !module.active)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${module.active ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
          >
            {module.active ? 'Desactivar' : 'Activar'}
          </button>
        )}
        {module.active && module.slug === 'sleep' && (
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Configurar
          </button>
        )}
        {module.active && module.slug === 'academic' && (
          <button
            type="button"
            onClick={() => setShowConfig(true)}
            className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Configurar
          </button>
        )}
      </div>
      {showConfig && module.slug === 'sleep' && (
        <SleepConfig
          config={module.config || {}}
          onSave={handleConfigSave}
          onClose={() => setShowConfig(false)}
        />
      )}
      {showConfig && module.slug === 'academic' && (
        <AcademicConfig
          config={module.config || {}}
          onSave={handleConfigSave}
          onClose={() => setShowConfig(false)}
        />
      )}
    </article>
  );
}
