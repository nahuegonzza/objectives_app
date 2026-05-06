'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Goal, GoalEntryWithGoal } from '@types';
import { parseLocalDate, formatLocalDate, getLocalDateString } from '@lib/dateHelpers';
import { doesGoalOverlapRange, isGoalActiveOnDate } from '@lib/goalHelpers';
import { getGoalIcon } from '@lib/goalIconsColors';
import { moduleDefinitions } from '../modules';

function getLocalDateStringFromEntry(dateString: string) {
  if (!dateString.includes('T')) {
    return dateString;
  }
  // Extraer YYYY-MM-DD directamente de la cadena ISO para evitar problemas de zona horaria
  return dateString.split('T')[0];
}

function getEntryPoints(entry: GoalEntryWithGoal) {
  return entry.goal.type === 'BOOLEAN'
    ? entry.valueBoolean ? Number(entry.goal.pointsIfTrue ?? 1) : Number(entry.goal.pointsIfFalse ?? 0)
    : Number(entry.valueFloat ?? 0) * Number(entry.goal.pointsPerUnit ?? 1);
}

const RANGE_LABELS = {
  week: 'Semana actual',
  month: 'Mes actual',
  year: 'Año actual',
  custom: 'Personalizado'
} as const;

function getRangeDays(range: 'week' | 'month' | 'year' | 'custom', fromDate?: string, toDate?: string) {
  if (range === 'week') return 7;
  if (range === 'month') return 30;
  if (range === 'year') return 365;
  if (!fromDate || !toDate) return 0;
  const start = parseLocalDate(fromDate);
  const end = parseLocalDate(toDate);
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
}

function getDatesInRange(from: string, to: string): string[] {
  const dates = [];
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(formatLocalDate(new Date(d)));
  }
  return dates;
}

function getCurrentWeekRange() {
  const today = parseLocalDate(getLocalDateString());
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { fromDate: formatLocalDate(start), toDate: formatLocalDate(end) };
}

function getCurrentMonthRange() {
  const today = parseLocalDate(getLocalDateString());
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { fromDate: formatLocalDate(start), toDate: formatLocalDate(end) };
}

function getCurrentYearRange() {
  const today = parseLocalDate(getLocalDateString());
  const start = new Date(today.getFullYear(), 0, 1);
  const end = new Date(today.getFullYear(), 11, 31);
  return { fromDate: formatLocalDate(start), toDate: formatLocalDate(end) };
}

export default function Analytics() {
  const [entries, setEntries] = useState<GoalEntryWithGoal[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [moduleEntries, setModuleEntries] = useState<any[]>([]);
  const [activeModules, setActiveModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [selectedGoalId, setSelectedGoalId] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState(getLocalDateString());
  const [viewMode, setViewMode] = useState<'overview' | 'goal'>('overview');
  const [dailyCollapsed, setDailyCollapsed] = useState(true);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (selectedRange === 'week') {
      const range = getCurrentWeekRange();
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    } else if (selectedRange === 'month') {
      const range = getCurrentMonthRange();
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    } else if (selectedRange === 'year') {
      const range = getCurrentYearRange();
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
  }, [selectedRange]);

  useEffect(() => {
    loadGoals();
    loadEntries();
    loadModuleEntries();
    loadModules();
  }, []);

  async function loadEntries() {
    setLoading(true);
    try {
      // Load all entries for analytics (no date filter)
      const res = await fetch('/api/goalEntries?all=true', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadModuleEntries() {
    try {
      const res = await fetch('/api/moduleEntries', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setModuleEntries(data);
    } catch (error) {
      console.error('Error loading module entries:', error);
    }
  }

  async function loadModules() {
    try {
      const res = await fetch('/api/modules', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const modules = await res.json();
      const active = modules.filter((m: any) => m.active);
      const withDefinitions = active.map((mod: any) => {
        const definition = moduleDefinitions.find(d => d.slug === mod.slug);
        return {
          ...mod,
          config: mod.config || definition?.defaultConfig || {},
          definition,
        };
      });
      setActiveModules(withDefinitions);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  }

  async function loadGoals() {
    try {
      const res = await fetch('/api/goals', { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setGoals(data);
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }

  const availableGoals = useMemo(
    () => goals.filter((goal) => doesGoalOverlapRange(goal, fromDate, toDate)),
    [goals, fromDate, toDate]
  );

  useEffect(() => {
    if (selectedGoalId !== 'all' && !availableGoals.some((goal) => goal.id === selectedGoalId)) {
      setSelectedGoalId('all');
    }
  }, [availableGoals, selectedGoalId]);

  const activeGoal = useMemo(() => goals.find((goal) => goal.id === selectedGoalId), [goals, selectedGoalId]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const entryDate = getLocalDateStringFromEntry(entry.date);
      const inRange = entryDate >= fromDate && entryDate <= toDate;
      const goalMatch = viewMode === 'goal' ? entry.goalId === selectedGoalId : true;
      return inRange && goalMatch && isGoalActiveOnDate(entry.goal, entryDate);
    });
  }, [entries, fromDate, toDate, selectedGoalId, viewMode]);

  const filteredModuleEntries = useMemo(() => {
    return moduleEntries.filter((entry) => {
      const entryDate = entry.date.slice(0, 10); // Extract YYYY-MM-DD from ISO string
      return entryDate >= fromDate && entryDate <= toDate;
    });
  }, [moduleEntries, fromDate, toDate]);

  const allDates = useMemo(() => {
    if (!fromDate || !toDate) return [];
    return getDatesInRange(fromDate, toDate);
  }, [fromDate, toDate]);

  const dailyScores = useMemo(() => {
    return allDates.map(date => {
      const dayEntries = filteredEntries.filter(entry => getLocalDateStringFromEntry(entry.date) === date);
      const goalPoints = dayEntries.reduce((sum, entry) => sum + getEntryPoints(entry), 0);

      // Calculate module points for this date
      let modulePoints = 0;
      for (const mod of activeModules) {
        if (mod.definition?.calculateScore) {
          const moduleDayEntries = filteredModuleEntries.filter((e) =>
            e.date.slice(0, 10) === date && e.moduleId === mod.id
          );
          modulePoints += mod.definition.calculateScore(moduleDayEntries, mod.config);
        }
      }

      const totalPoints = goalPoints + modulePoints;
      const hasData = dayEntries.length > 0 || modulePoints !== 0;
      return { date, points: totalPoints, displayDate: date.split('-').reverse().join('/'), hasData };
    });
  }, [allDates, filteredEntries, filteredModuleEntries, activeModules]);

  const totalPoints = useMemo(() => dailyScores.reduce((sum: number, item: { points: number }) => sum + item.points, 0), [dailyScores]);
  const averagePoints = useMemo(() => (allDates.length ? totalPoints / allDates.length : 0), [allDates.length, totalPoints]);
  const maxPoints = useMemo(() => (dailyScores.filter(s => s.hasData).length ? Math.max(...dailyScores.filter(s => s.hasData).map((item) => item.points)) : 0), [dailyScores]);
  const minPoints = useMemo(() => (dailyScores.filter(s => s.hasData).length ? Math.min(...dailyScores.filter(s => s.hasData).map((item) => item.points)) : 0), [dailyScores]);

  const chartPoints = useMemo(() => {
    if (dailyScores.length === 0) return '';
    const start = parseLocalDate(fromDate);
    const end = parseLocalDate(toDate);
    const totalMs = end.getTime() - start.getTime();
    const range = maxPoints - minPoints || 1;
    return dailyScores
      .map((item) => {
        const dateMs = parseLocalDate(item.date).getTime();
        const x = totalMs === 0 ? 50 : ((dateMs - start.getTime()) / totalMs) * 100;
        const points = item.hasData ? item.points : 0;
        const y = 90 - ((points - minPoints) / range) * 80;
        return `${x},${y}`;
      })
      .join(' ');
  }, [dailyScores, maxPoints, minPoints, fromDate, toDate]);

  const previousPeriodPoints = useMemo(() => {
    const days = getRangeDays(selectedRange, fromDate, toDate);
    const start = parseLocalDate(fromDate);
    const end = new Date(start);
    end.setDate(end.getDate() - 1);
    const previousStart = new Date(end);
    previousStart.setDate(previousStart.getDate() - days + 1);
    const prevStartKey = formatLocalDate(previousStart);
    const prevEndKey = formatLocalDate(end);

    const previousEntries = entries.filter((entry) => {
      const entryDate = getLocalDateStringFromEntry(entry.date);
      const inRange = entryDate >= prevStartKey && entryDate <= prevEndKey;
      const goalMatch = viewMode === 'goal' ? entry.goalId === selectedGoalId : true;
      return inRange && goalMatch && isGoalActiveOnDate(entry.goal, entryDate);
    });

    const previousModuleEntries = moduleEntries.filter((entry) => {
      const entryDate = entry.date.slice(0, 10);
      return entryDate >= prevStartKey && entryDate <= prevEndKey;
    });

    let goalPoints = previousEntries.reduce((sum, entry) => {
      const points = getEntryPoints(entry);
      return sum + points;
    }, 0);

    let modulePoints = 0;
    for (const mod of activeModules) {
      if (mod.definition?.calculateScore) {
        const modulePrevEntries = previousModuleEntries.filter((e) => e.moduleId === mod.id);
        modulePoints += mod.definition.calculateScore(modulePrevEntries, mod.config);
      }
    }

    return goalPoints + modulePoints;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, moduleEntries, fromDate, selectedGoalId, selectedRange, viewMode, activeModules]);

  const periodDiff = totalPoints - previousPeriodPoints;
  const periodDirection = periodDiff >= 0 ? 'Mejor' : 'Peor';
  const title = viewMode === 'overview' ? 'Resumen global' : 'Por objetivo: ' + (activeGoal?.title ?? 'Selecciona un objetivo');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-slate-600 dark:text-slate-400">
            {RANGE_LABELS[selectedRange]} • {fromDate} a {toDate}
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="week">Semana</option>
            <option value="month">Mes</option>
            <option value="year">Año</option>
            <option value="custom">Personalizado</option>
          </select>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="overview">Vista general</option>
            <option value="goal">Por objetivo</option>
          </select>
        </div>
      </div>

      {selectedRange === 'custom' && (
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Desde</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Hasta</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      )}

      {viewMode === 'goal' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Objetivo</label>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">Todos los objetivos</option>
            <option value="all">-</option>
            {availableGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>{goal.title}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPoints.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Promedio diario</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{averagePoints.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Máximo</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{maxPoints.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Vs período anterior</p>
          <p className={`text-2xl font-bold ${periodDiff >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {periodDiff >= 0 ? '+' : ''}{periodDiff.toFixed(1)}
          </p>
          <p className="text-xs text-slate-500">{periodDirection}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-4 px-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tendencia</h3>
        
        {/* Contenedor corregido: Se eliminó -mx-5 y se asegura el centrado */}
        <div className="h-64 w-full flex justify-center items-center">
          <svg 
            viewBox="0 0 280 100" 
            className="w-full h-full" 
            preserveAspectRatio="xMidYMid meet"
          >
            <polyline
              fill="none"
              stroke="rgb(34, 197, 94)"
              strokeWidth="1.5"
              strokeLinecap="round"
              points={dailyScores
                .map((item) => {
                  const start = parseLocalDate(fromDate);
                  const end = parseLocalDate(toDate);
                  const totalMs = end.getTime() - start.getTime();
                  const dateMs = parseLocalDate(item.date).getTime();

                  // 👉 Ajuste de centrado: Padding de 10 unidades a los lados
                  const paddingX = 10;
                  const availableWidth = 280 - (paddingX * 2);

                  const x = totalMs === 0
                    ? 140
                    : paddingX + ((dateMs - start.getTime()) / totalMs) * availableWidth;

                  const range = maxPoints - minPoints || 1;
                  const points = item.hasData ? item.points : 0;

                  // 👉 Y con margen del 10% arriba y abajo
                  const y = 90 - ((points - minPoints) / range) * 80;

                  return `${x},${y}`;
                })
                .join(' ')}
            />

            {dailyScores.map((score, index) => {
              if (!score.hasData) return null;

              const start = parseLocalDate(fromDate);
              const end = parseLocalDate(toDate);
              const totalMs = end.getTime() - start.getTime();
              const dateMs = parseLocalDate(score.date).getTime();

              // 👉 Mismo ajuste de centrado para los círculos
              const paddingX = 10;
              const availableWidth = 280 - (paddingX * 2);

              const x = totalMs === 0
                ? 140
                : paddingX + ((dateMs - start.getTime()) / totalMs) * availableWidth;

              const range = maxPoints - minPoints || 1;
              const y = 90 - ((score.points - minPoints) / range) * 80;

              // Lógica de Tooltips (se mantiene igual)
              const dayEntries = filteredEntries.filter(entry => getLocalDateStringFromEntry(entry.date) === score.date);
              const dayModuleEntries = filteredModuleEntries.filter((e) => e.date.slice(0, 10) === score.date);
              let modulePoints = 0;
              for (const mod of activeModules) {
                if (mod.definition?.calculateScore) {
                  const moduleDayEntries = dayModuleEntries.filter((e) => e.moduleId === mod.id);
                  modulePoints += mod.definition.calculateScore(moduleDayEntries, mod.config);
                }
              }

              const tooltipLines = [
                `Fecha: ${score.displayDate}`,
                ...dayEntries.map(entry => {
                  const points = getEntryPoints(entry);
                  if (entry.goal.type === 'BOOLEAN') {
                    return `${getGoalIcon(entry.goal.icon)} ${entry.goal.title}: ${entry.valueBoolean ? 'Cumplido' : 'No cumplido'} (${points} pts)`;
                  } else {
                    return `${getGoalIcon(entry.goal.icon)} ${entry.goal.title}: ${entry.valueFloat} (${points} pts)`;
                  }
                }),
                ...(modulePoints > 0 ? [`Módulos: ${modulePoints.toFixed(1)} pts`] : [])
              ];

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="2.5" // Un poquito más grande para facilitar el hover
                  fill="rgb(11, 128, 54)"
                  className="cursor-pointer"
                  onMouseEnter={(e) => setTooltip({ visible: true, x: e.clientX, y: e.clientY, content: tooltipLines.join('\n') })}
                  onMouseLeave={() => setTooltip({ visible: false, x: 0, y: 0, content: '' })}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Datos diarios</h3>
          <button
            type="button"
            onClick={() => setDailyCollapsed(!dailyCollapsed)}
            aria-expanded={!dailyCollapsed}
            className="inline-flex items-center gap-1 text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition"
          >
            <span className={`transform transition-transform ${dailyCollapsed ? '' : 'rotate-90'}`}>▶</span>
            {dailyCollapsed ? 'Abrir' : 'Cerrar'}
          </button>
        </div>

        {!dailyCollapsed && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Puntos</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Estado</th>
                </tr>
              </thead>
              <tbody>
                {dailyScores.map((score) => (
                  <tr key={score.date} className="border-t border-slate-200 dark:border-slate-700">
                    <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">{score.displayDate}</td>
                    <td className="px-4 py-2 text-sm text-slate-900 dark:text-white">{score.points.toFixed(1)}</td>
                    <td className="px-4 py-2 text-sm">
                      {score.hasData ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                          Con datos
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          Sin datos
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {tooltip.visible && (
        <div
          className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 text-sm text-slate-900 dark:text-white pointer-events-none"
          style={{
            top: tooltip.y - 10,
            left: tooltip.x,
            transform: 'translateX(-50%)',
          }}
        >
          {tooltip.content.split('\n').map((line, index) => (
            <p key={index} className="whitespace-nowrap">
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
