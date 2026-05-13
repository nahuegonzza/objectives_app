'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLocalDateString } from '@lib/dateHelpers';
import { getColorOption } from '@lib/goalIconsColors';
import { parseAcademicData, AcademicEvent, AcademicSubject } from './academicHelpers';
import { AcademicEventForm } from './AcademicEventForm';
import { useAcademicModule } from './useAcademicModule';
import { AcademicConfig } from './AcademicConfig';
import type { ModuleEntry } from '@types';

type GroupByOption = 'none' | 'date' | 'subject';

type SortOption = 'default' | 'dateAsc' | 'dateDesc' | 'subject' | 'priority';

type StatusFilter = 'all' | 'completed' | 'pending';

type EventTypeFilter = 'all' | 'exam' | 'task';

const formatDateLabel = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const getEventWeight = (event: AcademicEvent) => {
  if (event.type === 'exam') {
    switch (event.examType) {
      case 'final':
        return 0;
      case 'recuperatorio':
        return 1;
      case 'parcial':
      default:
        return 2;
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
    return `Tarea - Prioridad ${priorityCap}`;
  }
  return event.examType === 'final'
    ? 'Final'
    : event.examType === 'recuperatorio'
      ? 'Recuperatorio'
      : 'Parcial';
};

const getExamBadgeStyle = (event: AcademicEvent) => {
  if (event.type !== 'exam') return getTaskBadgeStyle(event.priority);
  switch (event.examType) {
    case 'final':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'recuperatorio':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300';
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
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [academicModuleId, setAcademicModuleId] = useState<string>('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);

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

  const handleDeleteEvent = async (event: AcademicEvent) => {
    if (!confirm('¿Eliminar este evento?')) {
      return;
    }

    await discardEvent(event);
    await loadAcademicEntries();
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
        console.error('Error loading academic module ID:', err);
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
  }, [allEvents, eventTypeFilter, statusFilter, subjectFilter, dateFrom, dateTo, search, sortBy]);

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
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-4 py-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Gestión universitaria</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">Visor académico</h1>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleOpenNewEvent}
              className="inline-flex items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900"
            >
              + Nuevo evento
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Image src="/navbar_icons/settings_icon.png" alt="Configuración" width={20} height={20} unoptimized />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <section className="space-y-4">
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
              <div className="rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 p-5 dark:from-slate-950/50 dark:to-slate-900/50 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">Materias</p>
                <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100">{summary.subjects}</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Materias únicas</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Vista rápida</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-50 p-4 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">Eventos totales</span>
                <span className="font-semibold">{summary.total}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-sky-50 p-4 text-sky-900 dark:bg-sky-950/20 dark:text-sky-200">
                <span className="text-sm text-sky-700 dark:text-sky-300">Exámenes</span>
                <span className="font-semibold">{summary.exams}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 p-4 text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                <span className="text-sm text-amber-700 dark:text-amber-300">Tareas</span>
                <span className="font-semibold">{summary.tasks}</span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-violet-50 p-4 text-violet-900 dark:bg-violet-950/20 dark:text-violet-200">
                <span className="text-sm text-violet-700 dark:text-violet-300">Completados</span>
                <span className="font-semibold">{summary.completed}</span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
          <div className="mb-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Filtro</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Buscar</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Título, descripción o materia"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              />
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Agrupar</span>
              <select
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value as GroupByOption)}
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
                onChange={(event) => setSortBy(event.target.value as SortOption)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="default">Sin orden</option>
                <option value="dateAsc">Fecha ascendente</option>
                <option value="dateDesc">Fecha descendente</option>
                <option value="subject">Materia</option>
                <option value="priority">Prioridad / examen</option>
              </select>
            </label>
          </div>

          <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Entre fechas</span>
              <div className="grid gap-2 sm:grid-cols-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(event) => setDateFrom(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(event) => setDateTo(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                />
              </div>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tipo</span>
              <select
                value={eventTypeFilter}
                onChange={(event) => setEventTypeFilter(event.target.value as EventTypeFilter)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todos</option>
                <option value="exam">Exámenes</option>
                <option value="task">Tareas</option>
              </select>
            </label>
            <label className="space-y-1 min-w-0">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Estado</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
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
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
              >
                <option value="all">Todas</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </label>
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
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words">{event.description || 'Sin descripción'}</p>
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
                      onClick={() => setCollapsedGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }))}
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
                                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words">{event.description || 'Sin descripción'}</p>
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
