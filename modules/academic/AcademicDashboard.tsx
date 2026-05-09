'use client';

import { useState, useEffect } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';
import type { ModuleState } from '@types';
import { useAcademicModule } from './useAcademicModule';
import { AcademicTodayCard } from './AcademicTodayCard';
import { AcademicEventForm } from './AcademicEventForm';
import type { AcademicEvent } from './academicHelpers';

interface AcademicDashboardProps {
  config: Record<string, unknown>;
  module: ModuleState;
  onUpdate?: () => void;
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
    toggleEventCompleted,
    addEvent,
    isSaving
  } = useAcademicModule(module.id, module.slug, selectedDate, config);

  const [showEventForm, setShowEventForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleToggleCompleted = async (event: AcademicEvent) => {
    await toggleEventCompleted(event);
    onUpdate?.();
  };

  const handleAddEvent = async (event: AcademicEvent) => {
    await addEvent(event);
    setShowEventForm(false);
    setMessage('✓ Evento creado');
    setMessageType('success');
    onUpdate?.();
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
      <AcademicEventForm
        subjects={subjects}
        isOpen={showEventForm}
        onClose={() => setShowEventForm(false)}
        onSave={handleAddEvent}
        isSaving={isSaving}
      />

      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Gestión Universitaria</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Organiza tus materias, parciales y tareas.</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Agrega materias, planifica exámenes y marca entregas completadas para que el score global capture tu progreso.</p>
          </div>
          <button
            onClick={() => setShowEventForm(true)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700"
          >
            + Agregar evento
          </button>
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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-stretch">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 flex flex-col h-full">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">Eventos para hoy</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sólo aparecen si la fecha coincide con hoy.</p>
            </div>
            <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-300">{todayEvents.length} eventos</span>
          </div>

          <div className="mt-5 space-y-4 flex-1">
            {todayEvents.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                No hay exámenes ni tareas para hoy. <button onClick={() => setShowEventForm(true)} className="font-semibold text-emerald-600 hover:underline dark:text-emerald-400">Agrega uno</button>
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

        <div className="flex flex-col gap-4 h-full">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 flex flex-col h-full">
            <p className="text-base font-semibold text-slate-900 dark:text-white">Próximos eventos</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Planifica lo que viene en los próximos días.</p>

            <div className="mt-5 space-y-3 flex-1">
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