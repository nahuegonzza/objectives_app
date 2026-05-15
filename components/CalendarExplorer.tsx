'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import type { GoalEntryWithGoal, Goal, Event, ModuleEntry } from '@types';
import { getLocalDateString, parseLocalDate, formatLocalDate } from '@lib/dateHelpers';
import { isGoalActiveOnDate } from '@lib/goalHelpers';
import { getGoalIcon, getBackgroundColors } from '@lib/goalIconsColors';
import { moduleDefinitions } from '../modules';
import { parseModuleConfig } from '../lib/modules';
import type { ActiveModule } from '../lib/modules';


type ScoreHistory = {
  previousDay: { points: number; date: string };
  previousWeek: { points: number; date: string };
};

const WEEKDAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MODE_LABELS = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  annual: 'Anual'
} as const;

function getEntryPoints(entry: GoalEntryWithGoal) {
  if (entry.goal.type === 'BOOLEAN') {
    return entry.valueBoolean ? Number(entry.goal.pointsIfTrue ?? 1) : Number(entry.goal.pointsIfFalse ?? 0);
  }
  return Number(entry.valueFloat ?? 0) * Number(entry.goal.pointsPerUnit ?? 1);
}

function getStatusClass(points: number) {
  if (points > 0) return 'bg-emerald-500 text-white';
  if (points < 0) return 'bg-rose-500 text-white';
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
}

function getWeekStart(date: Date) {
  const start = new Date(date);
  const offset = start.getDay();
  start.setDate(start.getDate() - offset);
  return start;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
}

function formatWeekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const formatDay = (date: Date) => date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  return `${formatDay(start)} – ${formatDay(end)}`;
}

function getYearList(scoresByDay: Map<string, { points: number; entries: GoalEntryWithGoal[]; events: Event[] }>, currentYear: number) {
  const years = new Set<number>();
  scoresByDay.forEach((_, key) => {
    years.add(parseLocalDate(key).getFullYear());
  });
  if (years.size === 0) years.add(currentYear);
  return Array.from(years).sort((a, b) => a - b);
}

function getMonthList(scoresByDay: Map<string, { points: number; entries: GoalEntryWithGoal[]; events: Event[] }>, year: number, currentMonth: number) {
  const months = new Set<number>();
  scoresByDay.forEach((_, key) => {
    const date = parseLocalDate(key);
    if (date.getFullYear() === year) {
      months.add(date.getMonth());
    }
  });
  if (months.size === 0) months.add(currentMonth);
  return Array.from(months).sort((a, b) => a - b);
}

function getWeekList(scoresByDay: Map<string, { points: number; entries: GoalEntryWithGoal[]; events: Event[] }>, year: number, currentWeekStart: string) {
  const weeks = new Map<string, Date>();
  scoresByDay.forEach((_, key) => {
    const date = parseLocalDate(key);
    if (date.getFullYear() === year) {
      const weekStart = getWeekStart(date);
      weeks.set(formatLocalDate(weekStart), weekStart);
    }
  });

  if (weeks.size === 0) {
    const current = parseLocalDate(currentWeekStart);
    const weekStart = getWeekStart(current);
    weeks.set(formatLocalDate(weekStart), weekStart);
  }

  return Array.from(weeks.values())
    .sort((a, b) => a.getTime() - b.getTime())
    .map((weekStart) => ({ value: formatLocalDate(weekStart), label: formatWeekLabel(weekStart) }));
}

export default function CalendarExplorer() {
  const today = getLocalDateString();
  const [entries, setEntries] = useState<GoalEntryWithGoal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [moduleEntries, setModuleEntries] = useState<ModuleEntry[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'weekly' | 'monthly' | 'annual'>('weekly');
  const [selectedDate, setSelectedDate] = useState(today);
  const [viewDate, setViewDate] = useState(parseLocalDate(today));
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [dayEdits, setDayEdits] = useState<Record<string, { valueBoolean?: boolean; valueFloat?: number }>>({});
  const [goalsCollapsed, setGoalsCollapsed] = useState(false);
  const [habitsCollapsed, setHabitsCollapsed] = useState(false);
  const [metricsCollapsed, setMetricsCollapsed] = useState(false);
  const [moduleCollapseStates, setModuleCollapseStates] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const isEditingDay = editingGoalId === selectedDate;

  const orderedModules = useMemo(() => {
    // Sort modules by the 'order' field from the database
    // Modules without an order field default to a high number (at the end)
    return [...activeModules].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  }, [activeModules]);

  const moodModule = orderedModules.find((m) => m.slug === 'mood');
  const sleepModules = orderedModules.filter((m) => m.slug === 'sleep');
  const academicModule = orderedModules.find((m) => m.slug === 'academic');
  const otherModules = orderedModules.filter((m) => !['mood', 'sleep', 'academic'].includes(m.slug));

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [entriesRes, goalsRes, scoreRes, eventsRes, modulesRes, moduleEntriesRes] = await Promise.all([
          fetch('/api/goalEntries', { credentials: 'include' }),
          fetch('/api/goals', { credentials: 'include' }),
          fetch(`/api/score/history?date=${selectedDate}`, { credentials: 'include' }),
          fetch('/api/events', { credentials: 'include' }),
          fetch('/api/modules', { credentials: 'include' }),
          fetch('/api/moduleEntries', { credentials: 'include' })
        ]);

        if (!entriesRes.ok || !goalsRes.ok || !scoreRes.ok || !eventsRes.ok || !modulesRes.ok || !moduleEntriesRes.ok) {
          return;
        }

        const entriesData = await entriesRes.json();
        const goalsData = await goalsRes.json();
        const scoreData = await scoreRes.json();
        const eventsData = await eventsRes.json();
        const modulesData = await modulesRes.json();
        const moduleEntriesData = await moduleEntriesRes.json();
        setEntries(entriesData);
        setGoals(goalsData);
        setScoreHistory(scoreData);
        setEvents(eventsData);
        setModuleEntries(moduleEntriesData);
        const active = modulesData.filter((m: any) => m.active);
        const withDefinitions = active.map((mod: any) => {
          const definition = moduleDefinitions.find(d => d.slug === mod.slug);
          return {
            ...mod,
            config: parseModuleConfig(mod.config) || definition?.defaultConfig || {},
            definition,
          };
        });
        setActiveModules(withDefinitions);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedDate]);

  const scoresByDay = useMemo(() => {
    const map = new Map<string, { points: number; entries: GoalEntryWithGoal[]; events: Event[] }>();

    entries.forEach((entry) => {
      const dateKey = entry.date.slice(0, 10);
      if (!isGoalActiveOnDate(entry.goal, dateKey)) return;
      const points = getEntryPoints(entry);
      const existing = map.get(dateKey) ?? { points: 0, entries: [], events: [] };
      existing.points += points;
      existing.entries.push(entry);
      map.set(dateKey, existing);
    });

    // Add module points
    moduleEntries.forEach((entry) => {
      const dateKey = entry.date.slice(0, 10);
      const mod = activeModules.find(m => m.id === entry.moduleId);
      if (mod?.definition?.calculateScore) {
        const moduleEntriesForDay = moduleEntries.filter(e => e.moduleId === mod.id && e.date.slice(0, 10) === dateKey);
        const modulePoints = mod.definition.calculateScore(moduleEntriesForDay, mod.config, dateKey);
        const existing = map.get(dateKey) ?? { points: 0, entries: [], events: [] };
        existing.points += modulePoints;
        map.set(dateKey, existing);
      }
    });

    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, moduleEntries, activeModules]);

  const selectedDayData = useMemo(() => scoresByDay.get(selectedDate) ?? { points: 0, entries: [], events: [] }, [scoresByDay, selectedDate]);

  function toggleModuleCollapse(slug: string) {
    setModuleCollapseStates((current) => ({
      ...current,
      [slug]: !current[slug],
    }));
  }

  const entriesByGoalId = useMemo(() => {
    const map = new Map<string, GoalEntryWithGoal>();
    selectedDayData.entries.forEach((entry) => {
      map.set(entry.goalId, entry);
    });
    return map;
  }, [selectedDayData]);

  const visibleGoals = useMemo(() => goals.filter((goal) => isGoalActiveOnDate(goal, selectedDate)), [goals, selectedDate]);

  const getOrderedBooleanGoals = () => {
    return [...visibleGoals].filter(goal => goal.type === 'BOOLEAN').sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  };

  const getOrderedNumericGoals = () => {
    return [...visibleGoals].filter(goal => goal.type === 'NUMERIC').sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = typeof b.order === 'number' ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  };

  const buildInitialDayEdits = () => {
    const edits: Record<string, { valueBoolean?: boolean; valueFloat?: number }> = {};
    visibleGoals.forEach((goal) => {
      const entry = entriesByGoalId.get(goal.id);
      edits[goal.id] = {
        valueBoolean: entry?.valueBoolean ?? false,
        valueFloat: entry?.valueFloat ?? undefined
      };
    });
    setDayEdits(edits);
    setEditingGoalId(selectedDate);
  };

  const handleEntryChange = (goalId: string, values: { valueBoolean?: boolean; valueFloat?: number }) => {
    setDayEdits((current) => ({
      ...current,
      [goalId]: {
        ...current[goalId],
        ...values
      }
    }));
  };

  async function executeWithConcurrency<T>(tasks: Array<() => Promise<T>>, limit: number = 4) {
    const results: PromiseSettledResult<T>[] = [];
    const activePromises: Promise<void>[] = [];

    for (const task of tasks) {
      const taskPromise = task()
        .then((value) => ({ status: 'fulfilled', value } as const))
        .catch((reason) => ({ status: 'rejected', reason } as const))
        .then((result) => {
          results.push(result);
        });

      let trackedPromise: Promise<void>;
      trackedPromise = taskPromise.finally(() => {
        const index = activePromises.indexOf(trackedPromise);
        if (index >= 0) {
          activePromises.splice(index, 1);
        }
      });

      activePromises.push(trackedPromise);

      if (activePromises.length >= limit) {
        await Promise.race(activePromises);
      }
    }

    await Promise.all(activePromises);
    return results;
  }

  const handleSaveGoalEntry = async (goal: Goal) => {
    const edit = dayEdits[goal.id];
    if (!edit) return null;

    const payload: any = {
      goalId: goal.id,
      date: selectedDate
    };

    if (goal.type === 'BOOLEAN') {
      payload.valueBoolean = Boolean(edit.valueBoolean);
    } else {
      payload.value = edit.valueFloat ?? 0;
    }

    const response = await fetch('/api/goalEntries', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(errorBody?.error || 'Failed to save entry');
    }

    const savedEntry: GoalEntryWithGoal = await response.json();
    setEntries((previous) => {
      const filtered = previous.filter((entry) => !(entry.goalId === goal.id && entry.date.slice(0, 10) === selectedDate));
      return [...filtered, savedEntry];
    });

    return savedEntry;
  };

  const handleSaveAllDayEntries = async () => {
    const tasks = visibleGoals.map((goal) => () => handleSaveGoalEntry(goal));
    const results = await executeWithConcurrency(tasks, 4);

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length > 0) {
      setMessage('Algunos registros no se pudieron guardar. Intenta nuevamente.');
      setMessageType('error');
    } else {
      setMessage('Registros guardados');
      setMessageType('success');
    }

    setEditingGoalId(null);
    setDayEdits({});

    const entriesRes = await fetch('/api/goalEntries', { credentials: 'include' });
    if (entriesRes.ok) {
      const entriesData = await entriesRes.json();
      setEntries(entriesData);
    }
  };

  const handleCancelDayEdit = () => {
    setEditingGoalId(null);
    setDayEdits({});
  };

  const rangeDates = useMemo(() => {
    const dates: Array<{ key: string; label: string; empty?: boolean }> = [];
    const activeDate = parseLocalDate(selectedDate);

    if (mode === 'weekly') {
      const start = getWeekStart(activeDate);
      for (let i = 0; i < 7; i += 1) {
        const current = new Date(start);
        current.setDate(start.getDate() + i);
        const key = formatLocalDate(current);
        dates.push({ key, label: current.getDate().toString() });
      }
    }

    if (mode === 'monthly') {
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startOffset = firstDay.getDay();

      for (let i = 0; i < startOffset; i += 1) {
        dates.push({ key: '', label: '', empty: true });
      }

      for (let day = 1; day <= lastDay.getDate(); day += 1) {
        const current = new Date(year, month, day);
        const key = formatLocalDate(current);
        dates.push({ key, label: day.toString() });
      }
    }

    return dates;
  }, [mode, selectedDate, viewDate]);

  useEffect(() => {
    if (mode === 'monthly') {
      const current = parseLocalDate(selectedDate);
      if (current.getMonth() !== viewDate.getMonth() || current.getFullYear() !== viewDate.getFullYear()) {
        setSelectedDate(formatLocalDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)));
      }
    }
  }, [mode, selectedDate, viewDate]);

  const annualSummary = useMemo(() => {
    const year = viewDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, monthIndex) => {
      const monthStart = new Date(year, monthIndex, 1);
      const monthEnd = new Date(year, monthIndex + 1, 0);
      let total = 0;

      for (let day = 1; day <= monthEnd.getDate(); day += 1) {
        const key = formatLocalDate(new Date(year, monthIndex, day));
        total += scoresByDay.get(key)?.points ?? 0;
      }

      return {
        monthIndex,
        label: monthStart.toLocaleString('es-ES', { month: 'short' }),
        total
      };
    });

    const max = Math.max(...months.map((item) => item.total), 1);
    return { months, max };
  }, [scoresByDay, viewDate]);

  const handleChangeMode = (nextMode: typeof mode) => {
    setMode(nextMode);
    if (nextMode === 'monthly' || nextMode === 'weekly') {
      setViewDate(parseLocalDate(selectedDate));
    }
  };

  const navigate = (direction: 'prev' | 'next') => {
    const next = new Date(viewDate);
    if (mode === 'weekly') {
      next.setDate(viewDate.getDate() + (direction === 'prev' ? -7 : 7));
      setSelectedDate(formatLocalDate(next));
    } else if (mode === 'monthly') {
      next.setMonth(viewDate.getMonth() + (direction === 'prev' ? -1 : 1));
    } else {
      next.setFullYear(viewDate.getFullYear() + (direction === 'prev' ? -1 : 1));
    }
    setViewDate(next);
  };

  const yearOptions = useMemo(() => getYearList(scoresByDay, viewDate.getFullYear()), [scoresByDay, viewDate]);

  const monthOptions = useMemo(
    () => getMonthList(scoresByDay, viewDate.getFullYear(), viewDate.getMonth()),
    [scoresByDay, viewDate]
  );

  const weekOptions = useMemo(
    () => getWeekList(scoresByDay, viewDate.getFullYear(), formatLocalDate(getWeekStart(parseLocalDate(selectedDate)))),
    [scoresByDay, viewDate, selectedDate]
  );

  const displayLabel = mode === 'monthly' ? formatMonthLabel(viewDate) : mode === 'annual' ? viewDate.getFullYear().toString() : selectedDate.split('-').reverse().join('/');

  const handleSelectYear = (year: number) => {
    const next = new Date(viewDate);
    next.setFullYear(year);
    setViewDate(next);
    if (mode === 'annual') {
      setSelectedDate(formatLocalDate(new Date(year, 0, 1)));
    } else if (mode === 'monthly') {
      setSelectedDate(formatLocalDate(new Date(year, viewDate.getMonth(), 1)));
    } else {
      const currentWeek = getWeekStart(parseLocalDate(selectedDate));
      if (currentWeek.getFullYear() !== year) {
        setSelectedDate(formatLocalDate(getWeekStart(new Date(year, 0, 1))));
      }
    }
  };

  const handleSelectMonth = (month: number) => {
    const next = new Date(viewDate.getFullYear(), month, 1);
    setViewDate(next);
    setSelectedDate(formatLocalDate(next));
  };

  const handleSelectWeek = (weekStart: string) => {
    const next = parseLocalDate(weekStart);
    setViewDate(next);
    setSelectedDate(weekStart);
  };

  return (
    <div className="space-y-6 transition-all duration-200">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Calendario</p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Visión temporal</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODE_LABELS) as Array<keyof typeof MODE_LABELS>).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleChangeMode(option)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${mode === option ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
            >
              {MODE_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((index) => (
            <div key={index} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {mode === 'annual' ? `Año ${displayLabel}` : `${MODE_LABELS[mode]} · ${displayLabel}`}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {mode === 'annual' && (
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  Año:
                  <div className="relative inline-flex">
                    <select
                      value={viewDate.getFullYear()}
                      onChange={(event) => handleSelectYear(Number(event.target.value))}
                      className="appearance-none rounded-full border border-slate-300 bg-slate-100 px-4 py-2 pr-10 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-200 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">▾</span>
                  </div>
                </label>
              )}

              {mode === 'monthly' && (
                <>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    Mes:
                    <div className="relative inline-flex">
                      <select
                        value={viewDate.getMonth()}
                        onChange={(event) => handleSelectMonth(Number(event.target.value))}
                        className="appearance-none rounded-full border border-slate-300 bg-slate-100 px-4 py-2 pr-10 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-200 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {monthOptions.map((month) => (
                          <option key={month} value={month}>{MONTH_LABELS[month]}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">▾</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    Año:
                    <div className="relative inline-flex">
                      <select
                        value={viewDate.getFullYear()}
                        onChange={(event) => handleSelectYear(Number(event.target.value))}
                        className="appearance-none rounded-full border border-slate-300 bg-slate-100 px-4 py-2 pr-10 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-200 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">▾</span>
                  </div>
                  </label>
                </>
              )}

              {mode === 'weekly' && (
                <>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    Semana:
                    <div className="relative inline-flex">
                      <select
                        value={formatLocalDate(getWeekStart(parseLocalDate(selectedDate)))}
                        onChange={(event) => handleSelectWeek(event.target.value)}
                        className="appearance-none rounded-full border border-slate-300 bg-slate-100 px-4 py-2 pr-10 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-200 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        {weekOptions.map((week) => (
                          <option key={week.value} value={week.value}>{week.label}</option>
                        ))}
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">▾</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    Año:
                    <div className="relative inline-flex">
                      <select
                        value={viewDate.getFullYear()}
                        onChange={(event) => handleSelectYear(Number(event.target.value))}
                        className="appearance-none rounded-full border border-slate-300 bg-slate-100 px-4 py-2 pr-10 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-200 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">▾</span>
                  </div>
                  </label>
                </>
              )}
            </div>
          </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('prev')}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                ◀
              </button>
              <button
                type="button"
                onClick={() => navigate('next')}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                ▶
              </button>
            </div>
          </div>

          {mode === 'annual' ? (
            <div className="space-y-4">
              {annualSummary.months.map((monthData) => (
                <button
                  key={monthData.monthIndex}
                  type="button"
                  onClick={() => {
                    const nextViewDate = new Date(viewDate.getFullYear(), monthData.monthIndex, 1);
                    setMode('monthly');
                    setViewDate(nextViewDate);
                    setSelectedDate(formatLocalDate(nextViewDate));
                  }}
                  className="flex w-full items-center gap-3 text-sm rounded-2xl border border-transparent px-3 py-2 text-left transition hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="w-16 text-slate-600 dark:text-slate-300">{monthData.label}</span>
                  <div className="flex-1 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${(monthData.total / annualSummary.max) * 100}%` }} />
                  </div>
                  <span className="w-16 text-right font-semibold text-slate-900 dark:text-white">{monthData.total.toFixed(1)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(mode === 'weekly') && (
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="rounded-2xl bg-slate-100 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {label}
                    </div>
                  ))}
                  {rangeDates.map((item) => {
                    const points = item.key ? scoresByDay.get(item.key)?.points ?? 0 : 0;
                    const isSelected = item.key === selectedDate;
                    return (
                      <button
                        key={item.key || `${item.label}-${Math.random()}`}
                        type="button"
                        onClick={() => item.key && setSelectedDate(item.key)}
                        disabled={!item.key}
                        className={`rounded-2xl p-3 min-h-[72px] transition ${item.key ? getStatusClass(points) : 'bg-transparent pointer-events-none'} ${isSelected ? 'ring-2 ring-slate-900 dark:ring-slate-200' : 'hover:shadow-lg'}`}
                      >
                        <span className="block text-base font-semibold text-slate-900 dark:text-white">{item.label}</span>
                        <span className="block text-xs text-slate-600 dark:text-slate-300">{item.key ? points.toFixed(1) : ''}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {mode === 'monthly' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {WEEKDAY_LABELS.map((label) => (
                      <div key={label} className="rounded-2xl py-2">{label}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {rangeDates.map((item, index) => {
                      const points = item.key ? scoresByDay.get(item.key)?.points ?? 0 : 0;
                      const isSelected = item.key === selectedDate;
                      return (
                        <button
                          key={`${item.key}-${index}`}
                          type="button"
                          onClick={() => item.key && setSelectedDate(item.key)}
                          disabled={!item.key}
                          className={`rounded-2xl p-3 min-h-[80px] transition ${item.key ? getStatusClass(points) : 'bg-transparent pointer-events-none'} ${isSelected ? 'ring-2 ring-slate-900 dark:ring-slate-200' : 'hover:shadow-lg'}`}
                        >
                          <span className="block text-sm font-semibold text-slate-900 dark:text-white">{item.label}</span>
                          <span className="block text-xs text-slate-600 dark:text-slate-300 mt-1">{item.key ? points.toFixed(1) : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Detalle</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{selectedDayData.points.toFixed(1)} pts</p>
                  </div>
                  <div className="text-right text-xs text-slate-600 dark:text-slate-300 ml-1">
                    <p>{selectedDate}</p>
                    <p>{selectedDayData.entries.length + selectedDayData.events.length} registro(s)</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Hoy</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedDayData.points.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Ayer</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {loading || !scoreHistory ? '–' : scoreHistory.previousDay.points.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Diferencia</p>
                  <p className={`mt-2 text-xl font-semibold ${selectedDayData.points - (scoreHistory?.previousDay.points ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {loading || !scoreHistory
                      ? '–'
                      : `${(selectedDayData.points - scoreHistory.previousDay.points).toFixed(1)}`}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Promedio semanal</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {loading || !scoreHistory
                      ? '–'
                      : `${(scoreHistory.previousWeek.points / 7).toFixed(1)}`}
                  </p>
                </div>
              </div>

              <div className="flex justify-end mb-4 gap-2">
                {!isEditingDay && (
                  <button
                    type="button"
                    onClick={buildInitialDayEdits}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold transition"
                  >
                    <Image src="/icons/ui/edit_icon.png" alt="Editar día" width={16} height={16} />
                    Editar día
                  </button>
                )}

                {isEditingDay && (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveAllDayEntries}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold transition"
                    >
                      💾 Guardar día
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDayEdit}
                      className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      ✕ Cancelar
                    </button>
                  </>
                )}
              </div>

              <div className="space-y-4">
                {orderedModules.map((module) => {
                  const Component = module.definition?.Component;

                  if (module.slug === 'goals') {
                    // Renderizar los objetivos aquí en el orden correcto
                    return (
                      <div key={module.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setGoalsCollapsed(!goalsCollapsed)}
                          className="flex items-center gap-1 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                        >
                          <span className={`transform transition-transform ${goalsCollapsed ? '' : 'rotate-90'}`}>▶</span>
                          {module.name}
                        </button>
                        {!goalsCollapsed && (
                          <div className="space-y-4">
                            {getOrderedBooleanGoals().length > 0 && (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setHabitsCollapsed(!habitsCollapsed)}
                                  className="flex items-center gap-1 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                                >
                                  <span className={`transform transition-transform ${habitsCollapsed ? '' : 'rotate-90'}`}>▶</span>
                                  Hábitos
                                </button>
                                {!habitsCollapsed && (
                                  <div className="space-y-2">
                                    {getOrderedBooleanGoals().map((goal) => {
                                      const entry = entriesByGoalId.get(goal.id);
                                      const colors = getBackgroundColors(goal.color);
                                      const editValues = dayEdits[goal.id];
                                      const hasEdit = isEditingDay && Boolean(editValues);
                                      return (
                                        <div 
                                          key={goal.id} 
                                          className={`flex flex-col gap-2 rounded-xl border px-3 py-2 transition-all ${
                                            isEditingDay ? 'hover:shadow-md cursor-pointer' : ''
                                          } [background-color:var(--bg-light)] [border-color:var(--border-light)] dark:[background-color:var(--bg-dark)] dark:[border-color:var(--border-dark)]`}
                                          style={{
                                            '--bg-light': colors.light,
                                            '--border-light': colors.lightBorder,
                                            '--bg-dark': colors.dark,
                                            '--border-dark': colors.darkBorder,
                                          } as React.CSSProperties & Record<string, string>}
                                        >
                                          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                                            <span className="text-lg flex-shrink-0">{getGoalIcon(goal.icon)}</span>
                                            <div className="min-w-0 flex-1 flex items-center">
                                              <div className="flex-1">
                                                <h3 className="font-medium text-sm truncate text-slate-900 dark:text-white">
                                                  {goal.title}
                                                </h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                                  {entry ? (
                                                    goal.type === 'BOOLEAN' ? (entry.valueBoolean ? '✓ Completado' : '✗ Pendiente') : `${entry.valueFloat} unidades`
                                                  ) : (
                                                    'No registrado'
                                                  )}
                                                </p>
                                              </div>
                                              {!isEditingDay && (
                                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                    {entry ? getEntryPoints(entry).toFixed(1) : '0'} pts
                                                  </span>
                                                  <span className="inline-flex h-2 w-2 rounded-full bg-current" />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {isEditingDay ? (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => handleEntryChange(goal.id, { valueBoolean: true })}
                                                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${editValues?.valueBoolean ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200'}`}
                                                >
                                                  Sí
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleEntryChange(goal.id, { valueBoolean: false })}
                                                  className={`rounded-lg px-3 py-1 text-sm font-semibold transition ${editValues?.valueBoolean === false ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-200'}`}
                                                >
                                                  No
                                                </button>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {getOrderedNumericGoals().length > 0 && (
                              <div className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => setMetricsCollapsed(!metricsCollapsed)}
                                  className="flex items-center gap-1 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                                >
                                  <span className={`transform transition-transform ${metricsCollapsed ? '' : 'rotate-90'}`}>▶</span>
                                  Métricas
                                </button>
                                {!metricsCollapsed && (
                                  <div className="space-y-2">
                                    {getOrderedNumericGoals().map((goal) => {
                                      const entry = entriesByGoalId.get(goal.id);
                                      const colors = getBackgroundColors(goal.color);
                                      const editValues = dayEdits[goal.id];
                                      const hasEdit = isEditingDay && Boolean(editValues);
                                      return (
                                        <div 
                                          key={goal.id} 
                                          className={`flex flex-col gap-2 rounded-xl border px-3 py-2 transition-all ${
                                            isEditingDay ? 'hover:shadow-md cursor-pointer' : ''
                                          } [background-color:var(--bg-light)] [border-color:var(--border-light)] dark:[background-color:var(--bg-dark)] dark:[border-color:var(--border-dark)]`}
                                          style={{
                                            '--bg-light': colors.light,
                                            '--border-light': colors.lightBorder,
                                            '--bg-dark': colors.dark,
                                            '--border-dark': colors.darkBorder,
                                          } as React.CSSProperties & Record<string, string>}
                                        >
                                          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                                            <span className="text-lg flex-shrink-0">{getGoalIcon(goal.icon)}</span>
                                            <div className="min-w-0 flex-1 flex items-center">
                                              <div className="flex-1">
                                                <h3 className="font-medium text-sm truncate text-slate-900 dark:text-white">
                                                  {goal.title}
                                                </h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                                                  {entry ? (
                                                    goal.type === 'BOOLEAN' ? (entry.valueBoolean ? '✓ Completado' : '✗ Pendiente') : `${entry.valueFloat} unidades`
                                                  ) : (
                                                    'No registrado'
                                                  )}
                                                </p>
                                              </div>
                                              {!isEditingDay && (
                                                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                                    {entry ? getEntryPoints(entry).toFixed(1) : '0'} pts
                                                  </span>
                                                  <span className="inline-flex h-2 w-2 rounded-full bg-current" />
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {isEditingDay ? (
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const current = Number(editValues?.valueFloat ?? 0);
                                                    const next = Math.max(0, current - 1);
                                                    handleEntryChange(goal.id, { valueFloat: next });
                                                  }}
                                                  className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition text-xs"
                                                  title="Disminuir"
                                                >
                                                  −
                                                </button>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="1"
                                                  value={editValues?.valueFloat ?? ''}
                                                  onChange={(event) => handleEntryChange(goal.id, { valueFloat: Number(event.target.value) })}
                                                  onWheel={(event) => {
                                                    event.preventDefault();
                                                    const current = Number(editValues?.valueFloat ?? 0);
                                                    const next = current + (event.deltaY < 0 ? 1 : -1);
                                                    handleEntryChange(goal.id, { valueFloat: Math.max(0, next) });
                                                  }}
                                                  className="flex h-6 w-8 items-center justify-center rounded border border-slate-300 bg-white text-center text-xs font-medium text-slate-900 outline-none transition focus:ring-2 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                                                  placeholder="0"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const current = Number(editValues?.valueFloat ?? 0);
                                                    const next = current + 1;
                                                    handleEntryChange(goal.id, { valueFloat: next });
                                                  }}
                                                  className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition text-xs"
                                                  title="Aumentar"
                                                >
                                                  +
                                                </button>
                                                <span className="text-xs text-slate-600 dark:text-slate-300 ml-1">unidades</span>
                                              </div>
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {visibleGoals.length === 0 && (
                              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                <p className="text-sm">No hay objetivos para este día</p>
                                <p className="text-xs mt-1">Crea objetivos en la página de Objetivos</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  } else if (!Component) {
                    return null;
                  } else {
                    const isCollapsed = moduleCollapseStates[module.slug] ?? false;

                    return (
                      <div key={module.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() => toggleModuleCollapse(module.slug)}
                          className="flex items-center gap-1 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                        >
                          <span className={`transform transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>▶</span>
                          {module.name}
                        </button>
                        {!isCollapsed && (
                          <Component
                            config={module.config}
                            module={module}
                            isEditing={isEditingDay}
                            date={selectedDate}
                          />
                        )}
                      </div>
                    );
                  }
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

