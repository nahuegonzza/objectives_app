'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { parseAcademicData, AcademicEvent, AcademicSubject } from './academicHelpers';
import { useAcademicModule } from './useAcademicModule';
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

  const { addEvent, toggleEventCompleted, discardEvent } = useAcademicModule('', 'academic', '', {});

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
    const { from, to } = getWeekBounds();
    setDateFrom(from);
    setDateTo(to);
  }, []);

  useEffect(() => {
    async function loadAcademicEntries() {
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
    }

    loadAcademicEntries();
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
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              Toda la información académica en una sola vista. Filtra, agrupa y explora exámenes y tareas con más detalle.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/academic/config"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Image src="/navbar_icons/settings_icon.png" alt="Configuración" width={20} height={20} unoptimized />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr]">
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

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
              <div className="grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Buscar</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Título, descripción o materia"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Agrupar</span>
                  <select
                    value={groupBy}
                    onChange={(event) => setGroupBy(event.target.value as GroupByOption)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="none">Sin orden</option>
                    <option value="date">Agrupar por fecha</option>
                    <option value="subject">Agrupar por materia</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Orden</span>
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as SortOption)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="default">Sin orden</option>
                    <option value="dateAsc">Fecha ascendente</option>
                    <option value="dateDesc">Fecha descendente</option>
                    <option value="subject">Materia</option>
                    <option value="priority">Prioridad / examen</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-4">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Entre fechas</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(event) => setDateFrom(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                    />
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(event) => setDateTo(event.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                    />
                  </div>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tipo</span>
                  <select
                    value={eventTypeFilter}
                    onChange={(event) => setEventTypeFilter(event.target.value as EventTypeFilter)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="all">Todos</option>
                    <option value="exam">Exámenes</option>
                    <option value="task">Tareas</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Estado</span>
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendientes</option>
                    <option value="completed">Completados</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Materia</span>
                  <select
                    value={subjectFilter}
                    onChange={(event) => setSubjectFilter(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900"
                  >
                    <option value="all">Todas</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
              <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Vista rápida</h2>
              <div className="mt-4 space-y-3">
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
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-950">
              <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Materias</h2>
              <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto">
                {subjects.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No hay materias registradas.</p>
                ) : (
                  subjects.map((subject) => (
                    <div key={subject.id} className="rounded-2xl bg-white p-3 text-sm dark:bg-slate-900">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white">{subject.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{subject.semester}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
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
              {groupBy === 'none' && filteredEvents.map((event) => (
                <article key={`${event.id}-${event.sourceDate}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-[0.18em] ${getExamBadgeStyle(event)}`}>
                          {getExamLabel(event)}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{formatDateLabel(event.sourceDate)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {event.completed ? 'Completado' : 'Pendiente'}
                        </span>
                      </div>
                      <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white truncate">{event.title}</h2>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words">{event.description || 'Sin descripción'}</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:items-end">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate max-w-32">
                        {event.subject?.name || 'Sin materia'}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {event.type === 'exam' ? `Examen ${event.examType ?? 'parcial'}` : ''}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {/* handle edit */}}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => {/* handle delete */}}
                          className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {groupBy !== 'none' && Object.entries(groupedEvents || {}).map(([groupLabel, groupItems]) => (
                <section key={groupLabel} className="space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{groupLabel}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{groupItems.length} evento(s)</p>
                  </div>
                  <div className="space-y-4">
                    {groupItems.map((event) => (
                      <article key={`${event.id}-${event.sourceDate}`} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-slate-950">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                              <span className={`rounded-full px-2 py-1 font-semibold uppercase tracking-[0.18em] ${getExamBadgeStyle(event)}`}>
                                {getExamLabel(event)}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400">{formatDateLabel(event.sourceDate)}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                {event.completed ? 'Completado' : 'Pendiente'}
                              </span>
                            </div>
                            <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-white truncate">{event.title}</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2 break-words">{event.description || 'Sin descripción'}</p>
                          </div>
                          <div className="flex flex-col gap-3 sm:items-end">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate max-w-32">
                              {event.subject?.name || 'Sin materia'}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {event.type === 'exam' ? `Examen ${event.examType ?? 'parcial'}` : ''}
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {/* handle edit */}}
                                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                onClick={() => {/* handle delete */}}
                                className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
