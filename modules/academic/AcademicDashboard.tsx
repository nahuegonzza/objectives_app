'use client';

import { getLocalDateString } from '@lib/dateHelpers';
import type { ModuleState } from '@types';
import { useAcademicModule } from './useAcademicModule';
import { AcademicTodayCard } from './AcademicTodayCard';
import type { AcademicEvent } from './academicHelpers';

interface AcademicDashboardProps {
  config: Record<string, unknown>;
  module: ModuleState;
  onUpdate?: (data: any) => void;
  isEditing?: boolean;
  date?: string;
}

export function AcademicDashboard({ config, module, onUpdate, isEditing = false, date }: AcademicDashboardProps) {
  const selectedDate = date || getLocalDateString();
  const {
    loading,
    error,
    subjects,
    todayEvents,
    upcomingEvents,
    toggleEventCompleted
  } = useAcademicModule(module.id, module.slug, selectedDate, config);

  const handleToggleCompleted = async (event: AcademicEvent) => {
    await toggleEventCompleted(event);
    onUpdate?.({ updated: true });
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        Cargando Gestión Universitaria...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Gestión Universitaria</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Organiza tus materias, parciales y tareas.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Agrega materias, planifica exámenes y marca entregas completadas para que el score global capture tu progreso.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Hoy</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{todayEvents.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Eventos para hoy</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Próximos</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{upcomingEvents.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Eventos programados</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Materias</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">{subjects.length}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Materias configuradas</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">Eventos para hoy</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sólo aparecen si la fecha coincide con hoy.</p>
            </div>
            <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">{todayEvents.length} eventos</span>
          </div>

          <div className="mt-5 space-y-4">
            {todayEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No hay exámenes ni tareas para hoy. Agrega un evento para comenzar.
              </div>
            ) : (
              todayEvents.map((event) => {
                const subject = subjects.find((item) => item.id === event.subjectId);
                return (
                  <AcademicTodayCard
                    key={event.id}
                    event={event}
                    subject={subject}
                    onToggleComplete={handleToggleCompleted}
                  />
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Próximos eventos</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Planifica lo que viene en los próximos días.</p>

            <div className="mt-5 space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  No hay eventos programados para fechas futuras.
                </div>
              ) : (
                upcomingEvents.slice(0, 5).map((event) => {
                  const subject = subjects.find((item) => item.id === event.subjectId);
                  return (
                    <div key={event.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.type === 'exam' ? 'Examen' : 'Tarea'} • {subject?.name ?? 'Materia'}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{event.date}</p>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{event.description || 'Sin descripción'}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {error ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}