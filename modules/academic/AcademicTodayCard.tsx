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
  
  const priorityColors = {
    alta: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400',
    media: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400',
    baja: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
    default: 'text-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-400'
  };

  const currentPriorityStyle = event.type === 'task' 
    ? (priorityColors[event.priority as keyof typeof priorityColors] || priorityColors.default)
    : priorityColors.media;

  return (
    <div className={`group relative overflow-hidden rounded-3xl border-2 ${borderColor} bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-950`}>
      {/* Header: Icono, Título y Check */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300`}>
            {icon}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentPriorityStyle}`}>
                {badgeText}
              </span>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                {subject?.name ?? 'Sin materia'}
              </p>
            </div>
            <h3 className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Toggle de completado */}
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => isEditing && onToggleComplete(event)}
            disabled={!isEditing}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              event.completed
                ? 'bg-emerald-500'
                : 'bg-slate-200 dark:bg-slate-800'
            } ${!isEditing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${event.completed ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Descripción */}
      <div className="mt-4">
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2 break-words">
          {event.description || 'Sin descripción adicional'}
        </p>
      </div>

      {/* Footer: Acciones de edición */}
      {isEditing && (onEdit || onDelete) && (
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-900">
          {onEdit && (
            <button
              onClick={() => onEdit(event)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(event)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-rose-500 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}