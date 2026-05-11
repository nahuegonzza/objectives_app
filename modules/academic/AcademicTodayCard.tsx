'use client';

import type { AcademicEvent, AcademicSubject } from './academicHelpers';

interface AcademicTodayCardProps {
  event: AcademicEvent;
  subject: AcademicSubject | undefined;
  onToggleComplete: (event: AcademicEvent) => Promise<void>;
  onEdit?: (event: AcademicEvent) => void;
  onDelete?: (event: AcademicEvent) => void;
  isEditing?: boolean;
}

export function AcademicTodayCard({ event, subject, onToggleComplete, onEdit, onDelete, isEditing = false }: AcademicTodayCardProps) {
  const icon = event.type === 'exam' ? (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6" />
      <path d="M9 12h4" />
      <path d="M12 16h2" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 13l4 4L19 7" />
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );

  const badgeText = event.type === 'exam'
    ? `${event.examType ?? 'Parcial'}`
    : `${event.priority ? `Prioridad ${event.priority}` : 'Tarea'}`;

  const borderColor = subject?.color ?? (event.type === 'exam' ? 'border-orange-400' : 'border-emerald-400');
  const priorityTextColor = event.type === 'task'
    ? event.priority === 'alta'
      ? 'text-rose-700 dark:text-rose-300'
      : event.priority === 'media'
        ? 'text-orange-700 dark:text-orange-300'
        : event.priority === 'baja'
          ? 'text-yellow-800 dark:text-yellow-300'
          : 'text-slate-700 dark:text-slate-300'
    : 'text-orange-700 dark:text-orange-300';

  const badgeBgColor = event.type === 'task'
    ? event.priority === 'alta'
      ? 'bg-rose-100 dark:bg-rose-950'
      : event.priority === 'media'
        ? 'bg-orange-100 dark:bg-orange-950'
        : event.priority === 'baja'
          ? 'bg-yellow-100 dark:bg-yellow-950'
          : 'bg-slate-100 dark:bg-slate-900'
    : 'bg-slate-100 dark:bg-slate-900';

  return (
    <div className={`rounded-3xl border-2 ${borderColor} bg-white p-4 shadow-sm dark:bg-slate-950`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{event.type === 'exam' ? 'Examen programado' : 'Tarea pendiente'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{subject?.name ?? 'Materia no encontrada'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && onEdit ? (
            <button
              type="button"
              onClick={() => onEdit(event)}
              className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700"
            >
              Editar
            </button>
          ) : null}
          {isEditing && onDelete ? (
            <button
              type="button"
              onClick={() => onDelete(event)}
              className="rounded-full border border-slate-200 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-200 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:border-rose-600 dark:hover:bg-rose-900"
            >
              Borrar
            </button>
          ) : null}
          <label className="inline-flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
            <span>Listo</span>
            <button
              type="button"
              onClick={() => isEditing && onToggleComplete(event)}
              disabled={!isEditing}
              aria-pressed={event.completed}
              className={`relative h-7 w-14 rounded-full transition-colors ${
                event.completed
                  ? 'bg-emerald-500'
                  : isEditing
                    ? 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
                    : 'bg-slate-200 dark:bg-slate-800 cursor-not-allowed'
              }`}
            >
              <span className={`absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-transform ${event.completed ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
          </label>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-slate-900 dark:text-white">{event.title}</p>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${priorityTextColor} ${badgeBgColor}`}>{badgeText}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{event.description || 'Sin descripción'}</p>
      </div>
    </div>
  );
}
