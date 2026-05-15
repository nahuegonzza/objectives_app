'use client';

import type { AcademicEvent, AcademicSubject } from './academicHelpers';
import { getAcademicExamTypeLabelByType } from './academicHelpers';
import { getColorOption } from '@lib/goalIconsColors';

const normalizeHex = (hex: string) => {
  let cleaned = hex.trim().replace('#', '');
  if (cleaned.length === 3) {
    cleaned = cleaned.split('').map((char) => char + char).join('');
  }
  return /^[0-9A-Fa-f]{6}$/.test(cleaned) ? cleaned : null;
};

const parseRgbString = (rgb: string) => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/i);
  if (!match) return null;
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
  };
};

const hexToRgba = (color: string, alpha: number) => {
  const normalized = normalizeHex(color);
  if (normalized) {
    const intValue = parseInt(normalized, 16);
    const r = (intValue >> 16) & 255;
    const g = (intValue >> 8) & 255;
    const b = intValue & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const rgb = parseRgbString(color);
  if (rgb) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  return undefined;
};

const getContrastTextColor = (color: string) => {
  const normalized = normalizeHex(color);
  let r: number | null = null;
  let g: number | null = null;
  let b: number | null = null;

  if (normalized) {
    const intValue = parseInt(normalized, 16);
    r = (intValue >> 16) & 255;
    g = (intValue >> 8) & 255;
    b = intValue & 255;
  } else {
    const rgb = parseRgbString(color);
    if (rgb) {
      r = rgb.r;
      g = rgb.g;
      b = rgb.b;
    }
  }

  if (r === null || g === null || b === null) return '#111';
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#111' : '#fff';
};

const getSubjectCardStyle = (color?: string) => {
  if (!color) return undefined;
  const bg = hexToRgba(color, 0.18);
  const start = hexToRgba(color, 0.26);
  const end = hexToRgba(color, 0.12);
  if (!bg || !start || !end) return undefined;
  return {
    borderColor: color,
    backgroundColor: bg,
    backgroundImage: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
  };
};

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
    ? getAcademicExamTypeLabelByType(event.examType)
    : `${event.priority ? `Prioridad ${event.priority}` : 'Tarea'}`;

  const examColors = {
    final: {
      badge: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300',
      border: 'border-emerald-400'
    },
    recuperatorio: {
      badge: 'text-violet-700 bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300',
      border: 'border-violet-400'
    },
    parcial: {
      badge: 'text-sky-700 bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300',
      border: 'border-sky-400'
    },
    exposicion: {
      badge: 'text-orange-700 bg-orange-100 dark:bg-orange-950/40 dark:text-orange-300',
      border: 'border-orange-400'
    },
    regular: {
      badge: 'text-indigo-700 bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300',
      border: 'border-indigo-400'
    },
    oral: {
      badge: 'text-fuchsia-700 bg-fuchsia-100 dark:bg-fuchsia-950/40 dark:text-fuchsia-300',
      border: 'border-fuchsia-400'
    }
  };

  const priorityColors = {
    alta: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400',
    media: 'text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400',
    baja: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400',
    default: 'text-slate-600 bg-slate-50 dark:bg-slate-900 dark:text-slate-400'
  };

  const currentPriorityStyle = event.type === 'task'
    ? (priorityColors[event.priority as keyof typeof priorityColors] || priorityColors.default)
    : examColors[(event.examType ?? 'parcial') as keyof typeof examColors].badge;

  const borderClass = event.type === 'exam'
    ? examColors[(event.examType ?? 'parcial') as keyof typeof examColors].border
    : 'border-emerald-400';

  const resolvedSubjectColor = subject?.color ? getColorOption(subject.color).bgColor : undefined;
  const cardStyles = getSubjectCardStyle(resolvedSubjectColor);

  const cardClassName = cardStyles
    ? 'group relative overflow-hidden rounded-3xl border-2 border-transparent bg-transparent p-5 shadow-sm transition-all hover:shadow-md'
    : `group relative overflow-hidden rounded-3xl border-2 ${borderClass} bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-950`;

  const iconStyles = resolvedSubjectColor ? {
    backgroundColor: hexToRgba(resolvedSubjectColor, 0.20),
    color: getContrastTextColor(resolvedSubjectColor),
  } : undefined;

  return (
    <div style={cardStyles} className={cardClassName}>
      {/* Header: Icono, Título y Check */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-300" style={iconStyles}>
            {icon}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${currentPriorityStyle}`}>
                {badgeText}
              </span>
              <p className="max-w-[14rem] truncate text-xs font-medium text-slate-400 dark:text-slate-500">
                {subject?.name ?? 'Sin materia'}
              </p>
            </div>
            <h3 className="max-w-full truncate text-lg font-bold leading-tight text-slate-900 dark:text-white">
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
      {(onEdit || onDelete) && (
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-900">
          {onEdit && (
            <button
              onClick={() => { if (isEditing) onEdit(event); }}
              disabled={!isEditing}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${isEditing ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900' : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'}`}
            >
              Editar
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => { if (isEditing) onDelete(event); }}
              disabled={!isEditing}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${isEditing ? 'text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30' : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'}`}
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}