'use client';

import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';

interface SleepDashboardProps {
  config: Record<string, unknown>;
  module: any; // ModuleState
  onUpdate?: (data: any) => void;
  isEditing?: boolean;
  date?: string; // Fecha seleccionada del calendario
}

interface SleepNap {
  id: string;
  start: string;
  end: string;
}

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  disabled?: boolean;
}

const formatTime = (hours: number, minutes: number) => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

const parseTime = (value: string) => {
  const [rawHours = '0', rawMinutes = '0'] = value.split(':');
  const hours = Math.min(23, Math.max(0, Number(rawHours) || 0));
  const minutes = Math.min(59, Math.max(0, Number(rawMinutes) || 0));
  return { hours, minutes };
};

const HIDE_SPINNER_CSS = `
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, disabled = false }) => {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [editingHours, setEditingHours] = useState(false);
  const [editingMinutes, setEditingMinutes] = useState(false);

  useEffect(() => {
    const parsed = parseTime(value);
    setHours(parsed.hours);
    setMinutes(parsed.minutes);
  }, [value]);

  const updateTime = (newHours: number, newMinutes: number) => {
    const formatted = formatTime(newHours, newMinutes);
    setHours(newHours);
    setMinutes(newMinutes);
    onChange(formatted);
  };

  const incrementHour = () => updateTime((hours + 1) % 24, minutes);
  const decrementHour = () => updateTime((hours - 1 + 24) % 24, minutes);
  const incrementMinute = () => updateTime(hours, (minutes + 15) % 60);
  const decrementMinute = () => updateTime(hours, (minutes - 15 + 60) % 60);

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? 0 : Math.min(23, Math.max(0, Number(e.target.value)));
    updateTime(val, minutes);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === '' ? 0 : Math.min(59, Math.max(0, Number(e.target.value)));
    updateTime(hours, val);
  };

  return (
    <div className="flex items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={incrementHour}
          disabled={disabled}
          className={`p-2 rounded-lg transition ${
            disabled
              ? 'text-slate-400 cursor-not-allowed dark:text-slate-600'
              : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <input
          type="number"
          min={0}
          max={23}
          value={String(hours).padStart(2, '0')}
          onChange={handleHoursChange}
          disabled={disabled}
          onFocus={() => setEditingHours(true)}
          onBlur={() => setEditingHours(false)}
          className={`w-16 text-3xl font-bold text-center rounded-lg border outline-none transition ${
            disabled
              ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              : 'border-emerald-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-emerald-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900'
          }`}
        />
        <button
          type="button"
          onClick={decrementHour}
          disabled={disabled}
          className={`p-2 rounded-lg transition ${
            disabled
              ? 'text-slate-400 cursor-not-allowed dark:text-slate-600'
              : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="text-3xl font-bold text-slate-900 dark:text-white">:</div>

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={incrementMinute}
          disabled={disabled}
          className={`p-2 rounded-lg transition ${
            disabled
              ? 'text-slate-400 cursor-not-allowed dark:text-slate-600'
              : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <input
          type="number"
          min={0}
          max={59}
          value={String(minutes).padStart(2, '0')}
          onChange={handleMinutesChange}
          disabled={disabled}
          onFocus={() => setEditingMinutes(true)}
          onBlur={() => setEditingMinutes(false)}
          className={`w-16 text-3xl font-bold text-center rounded-lg border outline-none transition ${
            disabled
              ? 'border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              : 'border-emerald-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:border-emerald-700 dark:bg-slate-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900'
          }`}
        />
        <button
          type="button"
          onClick={decrementMinute}
          disabled={disabled}
          className={`p-2 rounded-lg transition ${
            disabled
              ? 'text-slate-400 cursor-not-allowed dark:text-slate-600'
              : 'text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const SleepDashboard: React.FC<SleepDashboardProps> = ({ config, module, onUpdate, isEditing = false, date }) => {
  const [bedtime, setBedtime] = useState('');
  const [waketime, setWaketime] = useState('');
  const [naps, setNaps] = useState<SleepNap[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  // Usar la fecha proporcionada o hoy por defecto
  const selectedDate = date || getLocalDateString();

  useEffect(() => {
    async function loadTodayEntry() {
      try {
        const res = await fetch(`/api/moduleEntries?date=${selectedDate}&module=sleep`, { credentials: 'include' });
        const entries = await res.json();
        if (entries && entries.length > 0) {
          const entry = entries[0];
          const data = JSON.parse(entry.data);
          setBedtime(data.bedtime || '');
          setWaketime(data.waketime || '');
          setNaps(Array.isArray(data.naps) ? data.naps.map((nap: any, index: number) => ({
            id: nap.id || `nap-${index}`,
            start: nap.start || '',
            end: nap.end || ''
          })) : []);
        }
      } catch (error) {
        console.error('Error loading sleep entry', error);
      } finally {
        setLoading(false);
      }
    }
    loadTodayEntry();
  }, [selectedDate]);

  const calculateHours = React.useCallback(() => {
    let totalHours = 0;

    if (bedtime && waketime) {
      const bed = new Date(`1970-01-01T${bedtime}:00`);
      const wake = new Date(`1970-01-01T${waketime}:00`);
      if (wake < bed) wake.setDate(wake.getDate() + 1); // next day
      totalHours += (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
    }

    for (const nap of naps) {
      if (!nap.start || !nap.end) continue;
      const napStart = new Date(`1970-01-01T${nap.start}:00`);
      const napEnd = new Date(`1970-01-01T${nap.end}:00`);
      const end = napEnd < napStart ? new Date(napEnd.setDate(napEnd.getDate() + 1)) : napEnd;
      totalHours += (end.getTime() - napStart.getTime()) / (1000 * 60 * 60);
    }

    return totalHours;
  }, [bedtime, waketime, naps]);

  const calculatePoints = React.useCallback((hours: number) => {
    // Si no hay horas registradas, 0 puntos
    if (hours === 0) return 0;

    const idealHours = (config.idealHours as number) || 8;
    const maxPoints = (config.maxPoints as number) || 2;
    const toleranceMinutes = (config.toleranceMinutes as number) ?? 30;
    const penaltyMode = (config.penaltyMode as string) || 'automatic';
    const penaltyPerHour = (config.penaltyPerHour as number) || 1;

    const diff = Math.abs(hours - idealHours);
    const toleranceHours = toleranceMinutes / 60;
    const adjustedDiff = Math.max(0, diff - toleranceHours);
    const penalty = penaltyMode === 'automatic' ? adjustedDiff : penaltyPerHour * adjustedDiff;

    // Permitir puntos negativos
    return maxPoints - penalty;
  }, [config]);

  const saveEntry = React.useCallback(async (hours: number) => {
    try {
      const res = await fetch('/api/moduleEntries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          date: selectedDate,
          data: { bedtime, waketime, naps, hours }
        })
      });

      if (res.ok) {
        onUpdate?.({ bedtime, waketime, naps, hours });
      }
    } catch (error) {
      console.error('Error saving sleep data', error);
    }
  }, [bedtime, waketime, naps, module.id, onUpdate, selectedDate]);

  useEffect(() => {
    const hours = calculateHours();
    const pts = calculatePoints(hours);
    setPoints(pts);

    const hasCompleteNap = naps.some((nap) => nap.start && nap.end);
    const hasValidSleepData = (bedtime && waketime) || hasCompleteNap;

    if (isEditing && hasValidSleepData) {
      saveEntry(hours);
    }
  }, [bedtime, waketime, naps, config, isEditing, calculateHours, calculatePoints, saveEntry]);

  const hours = calculateHours();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <style>{HIDE_SPINNER_CSS}</style>
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Sueño</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Registra tu hora de dormir y despertar para mejorar tu rendimiento.</p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
            <button
              type="button"
              onClick={() => {
                const lastNap = naps[naps.length - 1];
                if (!lastNap || (lastNap.start && lastNap.end)) {
                  setNaps((prev) => [...prev, { id: `nap-${Date.now()}`, start: '', end: '' }]);
                }
              }}
              disabled={!isEditing || (naps.length > 0 && !(naps[naps.length - 1].start && naps[naps.length - 1].end))}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700"
            >
              Agregar Siesta
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <p className="mb-3 text-center text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Dormir</p>
            <TimePicker
              value={bedtime}
              onChange={setBedtime}
              disabled={!isEditing}
            />
          </div>
          <div>
            <p className="mb-3 text-center text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Despertar</p>
            <TimePicker
              value={waketime}
              onChange={setWaketime}
              disabled={!isEditing}
            />
          </div>
        </div>

        {naps.length > 0 && (
          <div className="mt-6 space-y-4">
            {naps.map((nap, index) => (
              <div key={nap.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Siesta {index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => setNaps((prev) => prev.filter((item) => item.id !== nap.id))}
                    disabled={!isEditing}
                    className="text-sm text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Eliminar
                  </button>
                </div>
                <div className="mt-3 grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-center text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Dormir</p>
                    <TimePicker
                      value={nap.start}
                      onChange={(value) => setNaps((prev) => prev.map((item) => item.id === nap.id ? { ...item, start: value } : item))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <p className="mb-3 text-center text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Despertar</p>
                    <TimePicker
                      value={nap.end}
                      onChange={(value) => setNaps((prev) => prev.map((item) => item.id === nap.id ? { ...item, end: value } : item))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Puntos</p>
            <p className={`text-2xl font-semibold ${points >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {points >= 0 ? `+${points.toFixed(1)}` : points.toFixed(1)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Duración</p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
              {hours.toFixed(1)}h / {(config.idealHours as number) || 8}h
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
