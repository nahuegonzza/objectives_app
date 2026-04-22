'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [modulesCollapsed, setModulesCollapsed] = useState(false);
  const [goalsCollapsed, setGoalsCollapsed] = useState(false);

  const isEditingDay = editingGoalId === selectedDate;

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [entriesRes, goalsRes, scoreRes, eventsRes, modulesRes, moduleEntriesRes] = await Promise.all([
          fetch('/api/goalEntries'),
          fetch('/api/goals'),
          fetch(`/api/score/history?date=${selectedDate}`),
          fetch('/api/events'),
          fetch('/api/modules'),
          fetch('/api/moduleEntries')
        ]);

        if (!entriesRes.ok || !goalsRes.ok || !scoreRes.ok || !eventsRes.ok || !modulesRes.ok || !moduleEntriesRes.ok) {
          console.error('API error:', { entriesRes: entriesRes.status, goalsRes: goalsRes.status, scoreRes: scoreRes.status, eventsRes: eventsRes.status, modulesRes: modulesRes.status, moduleEntriesRes: moduleEntriesRes.status });
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
      const module = activeModules.find(m => m.id === entry.moduleId);
      if (module?.definition?.calculateScore) {
        const moduleEntriesForDay = moduleEntries.filter(e => e.moduleId === module.id && e.date.slice(0, 10) === dateKey);
        const modulePoints = module.definition.calculateScore(moduleEntriesForDay, module.config);
        const existing = map.get(dateKey) ?? { points: 0, entries: [], events: [] };
        existing.points += modulePoints;
        map.set(dateKey, existing);
      }
    });

    return map;
  }, [entries, events, moduleEntries, activeModules]);

  const selectedDayData = scoresByDay.get(selectedDate) ?? { points: 0, entries: [], events: [] };

  const entriesByGoalId = useMemo(() => {
    const map = new Map<string, GoalEntryWithGoal>();
    selectedDayData.entries.forEach((entry) => {
      map.set(entry.goalId, entry);
    });
    return map;
  }, [selectedDayData]);

  const visibleGoals = useMemo(() => goals.filter((goal) => isGoalActiveOnDate(goal, selectedDate)), [goals, selectedDate]);

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

  const handleSaveGoalEntry = async (goal: Goal) => {
    const edit = dayEdits[goal.id];
    if (!edit) return;

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return;

    const savedEntry: GoalEntryWithGoal = await response.json();
    setEntries((previous) => {
      const filtered = previous.filter((entry) => !(entry.goalId === goal.id && entry.date.slice(0, 10) === selectedDate));
      return [...filtered, savedEntry];
    });
  };

  const handleSaveAllDayEntries = async () => {
    await Promise.all(visibleGoals.map(handleSaveGoalEntry));
    setEditingGoalId(null);
    setDayEdits({});
    // Reload data to reflect changes
    const entriesRes = await fetch('/api/goalEntries');
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

  const displayLabel = mode === 'monthly' ? formatMonthLabel(viewDate) : mode === 'annual' ? viewDate.getFullYear() : selectedDate;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-lg transition-all duration-200">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="text-sm text-slate-500 dark:text-slate-400">
              {mode === 'annual' ? 'Resumen de año' : `${MODE_LABELS[mode]} · ${displayLabel}`}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('prev')}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => navigate('next')}
                className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                →
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
                        className={`rounded-2xl p-3 min-h-[72px] transition ${item.key ? getStatusClass(points) : 'bg-transparent pointer-events-none'} ${isSelected ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : 'hover:shadow-lg'}`}
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
                          className={`rounded-2xl p-3 min-h-[80px] transition ${item.key ? getStatusClass(points) : 'bg-transparent pointer-events-none'} ${isSelected ? 'ring-2 ring-emerald-500 dark:ring-emerald-400' : 'hover:shadow-lg'}`}
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
                  <div className="text-right text-sm text-slate-600 dark:text-slate-300">
                    <p>{selectedDate}</p>
                    <p>{selectedDayData.entries.length + selectedDayData.events.length} registro(s)</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Hoy</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedDayData.points.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Ayer</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {loading || !scoreHistory ? '–' : scoreHistory.previousDay.points.toFixed(1)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Diferencia</p>
                  <p className={`mt-2 text-xl font-semibold ${selectedDayData.points - (scoreHistory?.previousDay.points ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {loading || !scoreHistory
                      ? '–'
                      : `${(selectedDayData.points - scoreHistory.previousDay.points).toFixed(1)}`}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Promedio semanal</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">
                    {loading || !scoreHistory
                      ? '–'
                      : `${(scoreHistory.previousWeek.points / 7).toFixed(1)}`}
                  </p>
                </div>
              </div>

              {activeModules.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setModulesCollapsed(!modulesCollapsed)}
                      className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                    >
                      <span className={`transform transition-transform ${modulesCollapsed ? 'rotate-90' : ''}`}>▶</span>
                      Módulos
                    </button>
                    <button
                      type="button"
                      onClick={buildInitialDayEdits}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm font-semibold transition"
                    >
                      ✏️ Editar día
                    </button>
                  </div>
                  {!modulesCollapsed && (
                    <div className="space-y-2">
                      {activeModules.map((module) => {
                        const Component = module.definition?.Component;
                        if (!Component) return null;
                        return (
                          <Component
                            key={module.slug}
                            config={module.config}
                            module={module}
                            isEditing={isEditingDay}
                            date={selectedDate}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setGoalsCollapsed(!goalsCollapsed)}
                    className="flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
                  >
                    <span className={`transform transition-transform ${goalsCollapsed ? 'rotate-90' : ''}`}>▶</span>
                    Objetivos
                  </button>
                </div>
                {isEditingDay && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAllDayEntries}
                      className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm font-semibold transition"
                    >
                      💾 Guardar día
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelDayEdit}
                      className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                )}
                {!goalsCollapsed && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {visibleGoals.map((goal) => {
                      const entry = entriesByGoalId.get(goal.id);
                      const colors = getBackgroundColors(goal.color);
                      const editValues = dayEdits[goal.id];
                      const hasEdit = isEditingDay && Boolean(editValues);
                      return (
                        <div 
                          key={goal.id} 
                          className="flex flex-col gap-2 rounded-xl border px-3 py-2 transition-all [background-color:var(--bg-light)] [border-color:var(--border-light)] dark:[background-color:var(--bg-dark)] dark:[border-color:var(--border-dark)]"
                          style={{
                            '--bg-light': colors.light,
                            '--border-light': colors.lightBorder,
                            '--bg-dark': colors.dark,
                            '--border-dark': colors.darkBorder,
                          } as React.CSSProperties & Record<string, string>}
                        >
                          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                            <span className="text-lg flex-shrink-0">{getGoalIcon(goal.icon)}</span>
                            <div className="min-w-0 flex-1">
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
                          </div>
                          {isEditingDay ? (
                            <div className="space-y-2">
                              {goal.type === 'BOOLEAN' ? (
                                <div className="flex items-center gap-2">
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
                              ) : (
                                <div className="flex items-center gap-2">
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
                                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                                  />
                                  <span className="text-sm text-slate-600 dark:text-slate-300">unidades</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <div />
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                                  {entry ? getEntryPoints(entry).toFixed(1) : '0'} pts
                                </span>
                                <span className="inline-flex h-2 w-2 rounded-full bg-current" />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
