'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLocalDateString, parseLocalDate } from '@lib/dateHelpers';
import { getColorOption } from '@lib/goalIconsColors';
import { parseAcademicData, AcademicEvent, AcademicSubject, AcademicTaskDuration, AcademicTaskPriority, getAcademicTaskTypes, AcademicTypeConfig } from './academicHelpers';
import { AcademicEventForm } from './AcademicEventForm';
import ConfirmationModal from '@components/ConfirmationModal';
import { useAcademicModule } from './useAcademicModule';
import { AcademicConfig } from './AcademicConfig';
import type { ModuleEntry } from '@types';

type GroupByOption = 'none' | 'date' | 'subject';

type SortOption = 'default' | 'dateAsc' | 'dateDesc' | 'subject' | 'priority';

type StatusFilter = 'all' | 'completed' | 'pending';

type EventTypeFilter = 'all' | 'exam' | 'task';

type PriorityFilter = 'all' | AcademicTaskPriority;

type DurationFilter = 'all' | AcademicTaskDuration;

const formatDateLabel = (dateString: string) => {
  const date = parseLocalDate(dateString);
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getEventWeight = (event: AcademicEvent) => {
  if (event.type === 'exam') {
    switch (event.examType) {
      case 'final':
        return 0;
      case 'recuperatorio':
        return 1;
      case 'exposicion':
        return 2;
      case 'oral':
        return 3;
      case 'parcial':
        return 4;
      case 'regular':
        return 5;
      default:
        return 6;
    }
  }

  switch (event.priority) {
    case 'alta':
      return 3;
    case 'media':
      return 4;
    case 'baja':
    default:
      return 5;
  }
};

const getExamLabel = (event: AcademicEvent) => {
  if (event.type !== 'exam') {
    const priority = event.priority ?? 'media';
    const priorityCap = priority.charAt(0).toUpperCase() + priority.slice(1);
    const duration = event.estimatedDuration ? ` • ${getDurationLabel(event.estimatedDuration)}` : '';
    return `Tarea - Prioridad ${priorityCap}${duration}`;
  }

  switch (event.examType) {
    case 'final':
      return 'Final';
    case 'recuperatorio':
      return 'Recuperatorio';
    case 'exposicion':
      return 'Exposición';
    case 'regular':
      return 'Regular';
    case 'oral':
      return 'Oral';
    case 'parcial':
    default:
      return 'Parcial';
  }
};

const getExamBadgeStyle = (event: AcademicEvent) => {
  if (event.type !== 'exam') return getTaskBadgeStyle(event.priority);
  switch (event.examType) {
    case 'final':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'recuperatorio':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300';
    case 'exposicion':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300';
    case 'regular':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300';
    case 'oral':
      return 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300';
    case 'parcial':
    default:
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300';
  }
};

const formatEventTitle = (title: string) => {
  return title.length > 28 ? `${title.slice(0, 28).trimEnd()}…` : title;
};

const getTaskBadgeStyle = (priority?: string) => {
  switch (priority) {
    case 'alta':
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    case 'media':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-300';
    case 'baja':
    default:
      return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300';
  }
};

const getDurationLabel = (duration: string) => {
  switch (duration) {
    case 'corta':
      return 'Corta';
    case 'media':
      return 'Media';
    case 'extensa':
      return 'Extensa';
    case 'lectura':
      return 'Lectura';
    case 'escritura':
      return 'Escritura';
    case 'codigo':
      return 'Código';
    case 'practica':
      return 'Práctica';
    default:
      return duration;
  }
};

function AcademicFilterModal({
  open,
  search,
  groupBy,
  sortBy,
  eventTypeFilter,
  statusFilter,
  subjectFilter,
  priorityFilter,
  durationFilter,
  dateFrom,
  dateTo,
  subjects,
  onClose,
  onClear,
  onChange,
}: {
  open: boolean;
  search: string;
  groupBy: GroupByOption;
  sortBy: SortOption;
  eventTypeFilter: EventTypeFilter;
  statusFilter: StatusFilter;
  subjectFilter: string;
  priorityFilter: PriorityFilter;
  durationFilter: DurationFilter;
  dateFrom: string;
  dateTo: string;
  subjects: AcademicSubject[];
  onClose: () => void;
  onClear: () => void;
  onChange: (field: string, value: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Filtrar eventos</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500 mb-2">Buscar</label>
            <input
              value={search}
              onChange={(e) => onChange('search', e.target.value)}
              placeholder="Título, descripción o materia"
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Agrupar</span>
              <select
                value={groupBy}
                onChange={(e) => onChange('groupBy', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="none">Sin orden</option>
                <option value="date">Agrupar por fecha</option>
                <option value="subject">Agrupar por materia</option>
              </select>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Orden</span>
              <select
                value={sortBy}
                onChange={(e) => onChange('sortBy', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="default">Sin orden</option>
                <option value="dateAsc">Fecha ascendente</option>
                <option value="dateDesc">Fecha descendente</option>
                <option value="subject">Materia</option>
                <option value="priority">Prioridad / examen</option>
              </select>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tipo</span>
              <select
                value={eventTypeFilter}
                onChange={(e) => onChange('eventTypeFilter', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todos</option>
                <option value="exam">Exámenes</option>
                <option value="task">Tareas</option>
              </select>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Prioridad</span>
              <select
                value={priorityFilter}
                onChange={(e) => onChange('priorityFilter', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 min-w-0 lg:col-span-2">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Entre fechas</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onChange('dateFrom', e.target.value)}
                  className="w-full min-w-[12rem] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onChange('dateTo', e.target.value)}
                  className="w-full min-w-[12rem] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                />
              </div>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Estado</span>
              <select
                value={statusFilter}
                onChange={(e) => onChange('statusFilter', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completados</option>
              </select>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Materia</span>
              <select
                value={subjectFilter}
                onChange={(e) => onChange('subjectFilter', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todas</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tipo de tarea</span>
              <select
                value={durationFilter}
                onChange={(e) => onChange('durationFilter', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todas</option>
                {availableTaskTypes.length > 0 ? availableTaskTypes.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                )) : (
                  <>
                    <option value="corta">Corta</option>
                    <option value="media">Media</option>
                    <option value="extensa">Extensa</option>
                    <option value="lectura">Lectura</option>
                    <option value="escritura">Escritura</option>
                    <option value="codigo">Código</option>
                    <option value="practica">Práctica</option>
                  </>
                )}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClear}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            >
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const normalizedHex = normalizeHex(color);
  if (normalizedHex) {
    const intValue = parseInt(normalizedHex, 16);
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
  const bg = hexToRgba(color, 0.16);
  const start = hexToRgba(color, 0.24);
  const end = hexToRgba(color, 0.10);
  if (!bg || !start || !end) return undefined;
  return {
    borderColor: color,
    backgroundColor: bg,
    backgroundImage: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
  };
};

export default function AcademicOverview() {
  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [academicModuleId, setAcademicModuleId] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);
  const [showDeleteEventConfirm, setShowDeleteEventConfirm] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<AcademicEvent | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [availableTaskTypes, setAvailableTaskTypes] = useState<AcademicTypeConfig[]>([]);
  const [academicConfigLoaded, setAcademicConfigLoaded] = useState(false);

  const todayString = getLocalDateString();
  const { addEvent, toggleEventCompleted, discardEvent } = useAcademicModule(academicModuleId, 'academic', todayString, {});

  const loadAcademicEntries = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/moduleEntries?module=academic', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('No se pudieron cargar los datos académicos');
      }

      const data: ModuleEntry[] = await res.json();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!academicModuleId) return;
    loadAcademicEntries();
  }, [academicModuleId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/modules', { credentials: 'include' });
        if (!res.ok) return;
        const modules = await res.json();
        const academicModule = modules.find((m: any) => m.name === 'academic' || m.moduleName === 'academic');
        if (!academicModule) return;
        const res2 = await fetch(`/api/modules/${academicModule.id}`, { credentials: 'include' });
        if (!res2.ok) return;
        const mod = await res2.json();
        const config = mod.config as Record<string, unknown> | undefined;
        setAvailableTaskTypes(getAcademicTaskTypes(config));
      } catch (err) {
        // ignore
      } finally {
        setAcademicConfigLoaded(true);
      }
    })();
  }, []);

  const handleOpenNewEvent = () => {
    setEditingEvent(null);
    setShowEventForm(true);
  };

  const handleEditEvent = (event: AcademicEvent) => {
    setEditingEvent(event);
    setShowEventForm(true);
  };

  const handleSaveEvent = async (event: AcademicEvent) => {
    await addEvent(event);
    await loadAcademicEntries();
    setEditingEvent(null);
    setShowEventForm(false);
  };

  const handleDeleteEvent = (event: AcademicEvent) => {
    setEventToDelete(event);
    setShowDeleteEventConfirm(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    await discardEvent(eventToDelete);
    await loadAcademicEntries();
    setEventToDelete(null);
    setShowDeleteEventConfirm(false);
  };

  const cancelDeleteEvent = () => {
    setEventToDelete(null);
    setShowDeleteEventConfirm(false);
  };

  const handleToggleReady = async (event: AcademicEvent) => {
    await toggleEventCompleted(event);
    await loadAcademicEntries();
  };

  const getWeekBounds = () => {
    const today = new Date();
    const weekday = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((weekday + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const pad = (value: number) => String(value).padStart(2, '0');
    const formatKey = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    return { from: formatKey(monday), to: formatKey(sunday) };
  };

  useEffect(() => {
    async function loadAcademicModuleId() {
      try {
        const res = await fetch('/api/modules', { credentials: 'include' });
        if (res.ok) {
          const modules = await res.json();
          const academicModule = Array.isArray(modules)
            ? modules.find((module: any) => module?.slug === 'academic')
            : null;
          if (academicModule?.id) {
            setAcademicModuleId(academicModule.id);
          }
        }
      } catch (err) {
      }
    }

    loadAcademicModuleId();
  }, []);

  const subjects = useMemo<AcademicSubject[]>(() => {
    const subjectMap = new Map<string, AcademicSubject>();
    entries.forEach((entry) => {
      const data = parseAcademicData(entry.data);
      data.subjects.forEach((subject) => {
        if (!subjectMap.has(subject.id)) subjectMap.set(subject.id, subject);
      });
    });
    return Array.from(subjectMap.values());
  }, [entries]);

  const allEvents = useMemo(() => {
    return entries.flatMap((entry) => {
      const parsed = parseAcademicData(entry.data);
      return parsed.events.map((event) => ({
        ...event,
        sourceDate: entry.date.slice(0, 10),
        subject: parsed.subjects.find((subject) => subject.id === event.subjectId),
      }));
    });
  }, [entries]);

  const filteredEvents = useMemo(() => {
    return allEvents
      .filter((event) => {
        if (eventTypeFilter !== 'all' && event.type !== eventTypeFilter) return false;
        if (statusFilter === 'completed' && !event.completed) return false;
        if (statusFilter === 'pending' && event.completed) return false;
        if (subjectFilter !== 'all' && event.subjectId !== subjectFilter) return false;
        if (priorityFilter !== 'all' && event.priority !== priorityFilter) return false;
        if (durationFilter !== 'all' && event.estimatedDuration !== durationFilter) return false;
        if (dateFrom && event.sourceDate < dateFrom) return false;
        if (dateTo && event.sourceDate > dateTo) return false;
        if (search.trim()) {
          const needle = search.trim().toLowerCase();
          return [event.title, event.description, event.subject?.name].some((value) =>
            value?.toLowerCase().includes(needle)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'dateAsc') {
          return a.sourceDate.localeCompare(b.sourceDate) || getEventWeight(a) - getEventWeight(b);
        }
        if (sortBy === 'dateDesc') {
          return b.sourceDate.localeCompare(a.sourceDate) || getEventWeight(a) - getEventWeight(b);
        }
        if (sortBy === 'subject') {
          return (a.subject?.name || '').localeCompare(b.subject?.name || '') || a.sourceDate.localeCompare(b.sourceDate);
        }
        if (sortBy === 'priority') {
          return getEventWeight(a) - getEventWeight(b) || a.sourceDate.localeCompare(b.sourceDate);
        }
        return 0;
      });
  }, [allEvents, eventTypeFilter, statusFilter, subjectFilter, priorityFilter, durationFilter, dateFrom, dateTo, search, sortBy]);

  const groupedEvents = useMemo(() => {
    if (groupBy === 'date') {
      return filteredEvents.reduce((groups, event) => {
        const key = event.sourceDate;
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
        return groups;
      }, {} as Record<string, typeof filteredEvents>);
    }

    if (groupBy === 'subject') {
      return filteredEvents.reduce((groups, event) => {
        const key = event.subject?.name || 'Sin materia';
        if (!groups[key]) groups[key] = [];
        groups[key].push(event);
        return groups;
      }, {} as Record<string, typeof filteredEvents>);
    }

    return null;
  }, [filteredEvents, groupBy]);

  const summary = useMemo(() => {
    const total = filteredEvents.length;
    const completed = filteredEvents.filter((event) => event.completed).length;
    const tasks = filteredEvents.filter((event) => event.type === 'task').length;
    const exams = filteredEvents.filter((event) => event.type === 'exam').length;
    return { total, completed, tasks, exams, subjects: subjects.length };
  }, [filteredEvents, subjects.length]);

  return (
    <div className="w-full">
      <div className="w-full">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Gestión universitaria</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOpenNewEvent}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900"
            >
              + Nuevo evento
            </button>
            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Filtrar
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Image src="/navbar_icons/settings_icon.png" alt="Configuración" width={20} height={20} unoptimized />
            </button>
          </div>
        </div>

        <section className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Inicio</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">Resumen</h2>
            </div>
          </div>
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-5 dark:from-emerald-950/50 dark:to-emerald-900/50 dark:border-emerald-700">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Eventos</p>
                  <p className="mt-3 text-3xl font-semibold text-emerald-900 dark:text-emerald-100">{summary.total}</p>
                  <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Tareas y exámenes</p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200 p-5 dark:from-sky-950/50 dark:to-sky-900/50 dark:border-sky-700">
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Exámenes</p>
                  <p className="mt-3 text-3xl font-semibold text-sky-900 dark:text-sky-100">{summary.exams}</p>
                  <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">Programados</p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-5 dark:from-amber-950/50 dark:to-amber-900/50 dark:border-amber-700">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">Tareas</p>
                  <p className="mt-3 text-3xl font-semibold text-amber-900 dark:text-amber-100">{summary.tasks}</p>
                  <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">Pendientes y completadas</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                <div className="rounded-3xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-5 dark:from-violet-950/50 dark:to-violet-900/50 dark:border-violet-700">
                  <p className="text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400">Completados</p>
                  <p className="mt-3 text-3xl font-semibold text-violet-900 dark:text-violet-100">{summary.completed}</p>
                  <p className="mt-1 text-sm text-violet-700 dark:text-violet-300">Eventos resueltos</p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-5 dark:from-red-950/50 dark:to-red-900/50 dark:border-red-700">
                  <p className="text-xs uppercase tracking-[0.2em] text-red-600 dark:text-red-400">Pendientes</p>
                  <p className="mt-3 text-3xl font-semibold text-red-900 dark:text-red-100">{summary.total - summary.completed}</p>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">Eventos sin completar</p>
                </div>
              </div>
          </div>
        </section>

        <AcademicFilterModal
          open={showFilterModal}
          search={search}
          groupBy={groupBy}
          sortBy={sortBy}
          eventTypeFilter={eventTypeFilter}
          statusFilter={statusFilter}
          subjectFilter={subjectFilter}
          priorityFilter={priorityFilter}
          durationFilter={durationFilter}
          dateFrom={dateFrom}
          dateTo={dateTo}
          subjects={subjects}
          onClose={() => setShowFilterModal(false)}
          onClear={() => {
            setSearch('');
            setGroupBy('none');
            setSortBy('priority');
            setEventTypeFilter('all');
            setStatusFilter('all');
            setSubjectFilter('all');
            setPriorityFilter('all');
            setDurationFilter('all');
            setDateFrom('');
            setDateTo('');
          }}
          onChange={(field, value) => {
            switch (field) {
              case 'search':
                setSearch(value);
                break;
              case 'groupBy':
                setGroupBy(value as GroupByOption);
                break;
              case 'sortBy':
                setSortBy(value as SortOption);
                break;
              case 'eventTypeFilter':
                setEventTypeFilter(value as EventTypeFilter);
                break;
              case 'statusFilter':
                setStatusFilter(value as StatusFilter);
                break;
              case 'subjectFilter':
                setSubjectFilter(value);
                break;
              case 'priorityFilter':
                setPriorityFilter(value as PriorityFilter);
                break;
              case 'durationFilter':
                setDurationFilter(value as DurationFilter);
                break;
              case 'dateFrom':
                setDateFrom(value);
                break;
              case 'dateTo':
                setDateTo(value);
                break;
              default:
                break;
            }
          }}
        />

        <section className="mt-6 rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Eventos</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900 dark:text-white">{filteredEvents.length} resultados</h2>
            </div>
          </div>
            <div className="mt-6">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-28 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-700 dark:border-rose-700/40 dark:bg-rose-950/40 dark:text-rose-200">
                  {error}
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  No hay eventos académicos que coincidan con los filtros.
                </div>
              ) : (
                <div className="space-y-6">
                  {groupBy === 'none' && filteredEvents.map((event) => {
                    const subject = event.subject;
                    const resolvedSubjectColor = subject?.color ? getColorOption(subject.color).bgColor : undefined;
                    const cardStyles = getSubjectCardStyle(resolvedSubjectColor);
                    const cardClassName = cardStyles
                      ? 'rounded-3xl border border-transparent bg-transparent p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl'
                      : 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950';
                    const subjectBadgeStyles = resolvedSubjectColor ? {
                      backgroundColor: hexToRgba(resolvedSubjectColor, 0.22) ?? 'rgba(148, 163, 184, 0.16)',
                      color: getContrastTextColor(resolvedSubjectColor),
                    } : undefined;
                    return (
                      <article key={`${event.id}-${event.sourceDate}`} style={cardStyles} className={cardClassName}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-[0.18em] ${getExamBadgeStyle(event)}`}>
                                {getExamLabel(event)}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">{formatDateLabel(event.sourceDate)}</span>
                              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${event.completed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                {event.completed ? 'Completado' : 'Pendiente'}
                              </span>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold leading-snug text-slate-900 dark:text-white max-w-full truncate whitespace-nowrap overflow-hidden">{formatEventTitle(event.title)}</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-all">{event.description || 'Sin descripción'}</p>
                          </div>
                          <div className="flex flex-col gap-3 sm:items-end">
                            <span style={subjectBadgeStyles} className="rounded-full px-3 py-1 text-sm font-semibold max-w-[11rem] truncate whitespace-nowrap overflow-hidden block">
                              {event.subject?.name || 'Sin materia'}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleReady(event)}
                                className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800"
                                aria-label={event.completed ? 'Deshacer' : 'Marcar como listo'}
                              >
                                <Image
                                  src={event.completed ? '/icons/ui/cancel_icon.png' : '/icons/ui/check_icon.png'}
                                  alt={event.completed ? 'Deshacer' : 'Listo'}
                                  width={18}
                                  height={18}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEditEvent(event)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                aria-label="Editar"
                              >
                                <Image src="/icons/ui/edit_icon.png" alt="Editar" width={18} height={18} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(event)}
                                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                aria-label="Eliminar"
                              >
                                <Image src="/icons/ui/delete_icon.png" alt="Eliminar" width={18} height={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  {groupBy !== 'none' && Object.entries(groupedEvents || {}).map(([groupLabel, groupItems]) => (
                    <section key={groupLabel} className="space-y-4">
                      <div className="p-4">
                        <button
                          onClick={() => setCollapsedGroups((prev) => ({ ...prev, [groupLabel]: !prev[groupLabel] }))}
                          className="flex items-center gap-1 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                        >
                          <span className={`transform transition-transform ${collapsedGroups[groupLabel] ? '' : 'rotate-90'}`}>▶</span>
                          {groupLabel}
                        </button>
                      </div>
                      {!collapsedGroups[groupLabel] && (
                        <div className="space-y-4">
                          {groupItems.map((event) => {
                            const subject = event.subject;
                            const resolvedSubjectColor = subject?.color ? getColorOption(subject.color).bgColor : undefined;
                            const cardStyles = getSubjectCardStyle(resolvedSubjectColor);
                            const cardClassName = cardStyles
                              ? 'rounded-3xl border border-transparent bg-transparent p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl'
                              : 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950';
                            const subjectBadgeStyles = resolvedSubjectColor ? {
                              backgroundColor: hexToRgba(resolvedSubjectColor, 0.22) ?? 'rgba(148, 163, 184, 0.16)',
                              color: getContrastTextColor(resolvedSubjectColor),
                              borderColor: hexToRgba(resolvedSubjectColor, 0.3) ?? 'transparent',
                            } : undefined;
                            return (
                              <article key={`${event.id}-${event.sourceDate}`} style={cardStyles} className={cardClassName}>
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-[0.18em] ${getExamBadgeStyle(event)}`}>
                                        {getExamLabel(event)}
                                      </span>
                                      <span className="text-slate-500 dark:text-slate-400">{formatDateLabel(event.sourceDate)}</span>
                                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${event.completed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                                        {event.completed ? 'Completado' : 'Pendiente'}
                                      </span>
                                    </div>
                                    <h2 className="mt-4 text-xl font-semibold leading-snug text-slate-900 dark:text-white max-w-full truncate whitespace-nowrap overflow-hidden">{formatEventTitle(event.title)}</h2>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-all">{event.description || 'Sin descripción'}</p>
                                  </div>
                                  <div className="flex flex-col gap-3 sm:items-end">
                                    <span style={subjectBadgeStyles} className="rounded-full px-3 py-1 text-sm font-semibold max-w-[11rem] truncate whitespace-nowrap overflow-hidden block">
                                      {event.subject?.name || 'Sin materia'}
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleReady(event)}
                                        className="rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-800"
                                        aria-label={event.completed ? 'Deshacer' : 'Marcar como listo'}
                                      >
                                        <Image
                                          src={event.completed ? '/icons/ui/cancel_icon.png' : '/icons/ui/check_icon.png'}
                                          alt={event.completed ? 'Deshacer' : 'Listo'}
                                          width={18}
                                          height={18}
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleEditEvent(event)}
                                        className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                        aria-label="Editar"
                                      >
                                        <Image src="/icons/ui/edit_icon.png" alt="Editar" width={18} height={18} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteEvent(event)}
                                        className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                                        aria-label="Eliminar"
                                      >
                                        <Image src="/icons/ui/delete_icon.png" alt="Eliminar" width={18} height={18} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  ))}
                </div>
              )}
            </div>
        </section>
      </div>

      <AcademicEventForm
        subjects={subjects}
        event={editingEvent ?? undefined}
        isOpen={showEventForm}
        onClose={() => {
          setShowEventForm(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
      />
      <ConfirmationModal
        open={showDeleteEventConfirm}
        title="Eliminar evento"
        description="¿Eliminar este evento?"
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={confirmDeleteEvent}
        onCancel={cancelDeleteEvent}
      />

      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 dark:bg-slate-950">
            <AcademicConfig
              config={{}}
              moduleId={academicModuleId}
              moduleName="academic"
              onSave={async () => true}
              onClose={() => setShowConfigModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

