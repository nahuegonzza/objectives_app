'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Goal, GoalEntryWithGoal, Event, DailyScore } from '@types';
import { getLocalDateString, parseLocalDate, formatLocalDate } from '@lib/dateHelpers';
import { calculateDailyScore } from '@core/score/scoreCalculator';
import CompactGoalItem from '@components/CompactGoalItem';
import { getActiveModules, type ActiveModule } from '../lib/modules';

function buildEntryPayload(goal: Goal, value: boolean | number | null, date: string) {
  return goal.type === 'BOOLEAN'
    ? { goalId: goal.id, date, valueBoolean: Boolean(value) }
    : { goalId: goal.id, date, value: Number(value ?? 0) };
}

function getLocalDateStringFromEntry(dateString: string) {
  if (!dateString.includes('T')) {
    return dateString;
  }
  // Extraer YYYY-MM-DD directamente de la cadena ISO para evitar problemas de zona horaria
  return dateString.split('T')[0];
}

export default function HistoryViewer() {
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [entries, setEntries] = useState<GoalEntryWithGoal[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeModules, setActiveModules] = useState<ActiveModule[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null);

  useEffect(() => {
    loadGoals();
    loadModules();
  }, []);

  useEffect(() => {
    loadEntries();
    loadEvents();
  }, [selectedDate]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function loadGoals() {
    try {
      const res = await fetch('/api/goals');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setGoals(data.sort((a: Goal, b: Goal) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (error) {
      console.error('Error loading goals:', error);
    }
  }

  async function loadModules() {
    try {
      const modules = await getActiveModules();
      setActiveModules(modules);
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  }

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch(`/api/goalEntries?date=${selectedDate}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents() {
    try {
      const res = await fetch(`/api/events?date=${selectedDate}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  }

  async function handleSaveEntry(goal: Goal, value: boolean | number) {
    setSavingGoalId(goal.id);
    setMessage('');

    setEntries((prevEntries) => {
      const existingIndex = prevEntries.findIndex((entry) =>
        entry.goalId === goal.id && getLocalDateStringFromEntry(entry.date) === selectedDate
      );
      const updatedEntry = {
        id: existingIndex !== -1 ? prevEntries[existingIndex].id : `temp-${goal.id}`,
        userId: goal.userId,
        goalId: goal.id,
        date: selectedDate,
        createdAt: existingIndex !== -1 ? prevEntries[existingIndex].createdAt : new Date().toISOString(),
        goal,
        valueBoolean: goal.type === 'BOOLEAN' ? Boolean(value) : prevEntries[existingIndex]?.valueBoolean ?? null,
        valueFloat: goal.type === 'NUMERIC' ? Number(value) : prevEntries[existingIndex]?.valueFloat ?? null
      } as GoalEntryWithGoal;

      if (existingIndex !== -1) {
        return prevEntries.map((entry, index) => index === existingIndex ? updatedEntry : entry);
      }

      return [...prevEntries, updatedEntry];
    });

    try {
      const payload = buildEntryPayload(goal, value, selectedDate);
      const res = await fetch('/api/goalEntries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMessage('✓ Registrado');
        setMessageType('success');
      } else {
        setMessage('Error al guardar');
        setMessageType('error');
        await loadEntries();
      }
    } catch (error) {
      setMessage('Error de conexión');
      setMessageType('error');
      await loadEntries();
    } finally {
      setSavingGoalId(null);
    }
  }

  const goalEntriesMap = useMemo(
    () => new Map(entries.map((entry) => [entry.goalId, entry])),
    [entries]
  );

  const [dailyScore, setDailyScore] = useState<DailyScore>({ points: 0, date: selectedDate, note: '' });

  const prevDate = () => {
    const date = parseLocalDate(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(formatLocalDate(date));
  };

  const nextDate = () => {
    const date = parseLocalDate(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(formatLocalDate(date));
  };

  const today = getLocalDateString();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm dark:shadow-lg">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Historial
            </p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {selectedDate}
            </h2>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={prevDate}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              ← Anterior
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={nextDate}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              Siguiente →
            </button>
            <button
              onClick={() => setSelectedDate(today)}
              className="rounded-lg bg-emerald-600 dark:bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-700 dark:hover:bg-emerald-700 transition"
            >
              Hoy
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 p-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              messageType === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                {dailyScore.points.toFixed(1)}
              </p>
              <p className="text-sm text-emerald-800 dark:text-emerald-200">puntos</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Estado</p>
              <p
                className={`text-lg font-semibold ${
                  dailyScore.points >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-amber-700 dark:text-amber-300'
                }`}
              >
                {dailyScore.points >= 0 ? '✓ Positivo' : '⚠ Ajuste'}
              </p>
            </div>
          </div>
          <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
            {dailyScore.note}
          </p>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <p className="text-slate-500 dark:text-slate-400">No hay objetivos para mostrar.</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <CompactGoalItem
                key={goal.id}
                goal={goal}
                entry={goalEntriesMap.get(goal.id)}
                isLoading={savingGoalId === goal.id}
                onChange={handleSaveEntry}
              />
            ))}
          </div>
        )}

        {/* Modules Section */}
        {activeModules.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Módulos</h3>
            <div className="space-y-3">
              {activeModules.map((module) => {
                const HistoryComponent = module.definition?.HistoryComponent;
                if (!HistoryComponent) return null;

                // Get events for this module
                const moduleEvents = events.filter(e => e.moduleId === module.id);
                const data = moduleEvents.length > 0 ? moduleEvents[0].metadata : {};

                return (
                  <HistoryComponent key={module.slug} date={selectedDate} data={data} />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
