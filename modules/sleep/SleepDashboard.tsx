'use client';

import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';

interface SleepDashboardProps {
  config: Record<string, unknown>;
  module: any; // ModuleState
  onUpdate?: (data: any) => void;
  isEditing?: boolean;
}

export const SleepDashboard: React.FC<SleepDashboardProps> = ({ config, module, onUpdate, isEditing = false }) => {
  const [bedtime, setBedtime] = useState('');
  const [waketime, setWaketime] = useState('');
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  const today = getLocalDateString();

  useEffect(() => {
    async function loadTodayEntry() {
      try {
        const res = await fetch(`/api/moduleEntries?date=${today}&module=sleep`);
        const entries = await res.json();
        if (entries && entries.length > 0) {
          const entry = entries[0];
          const data = JSON.parse(entry.data);
          setBedtime(data.bedtime || '');
          setWaketime(data.waketime || '');
        }
      } catch (error) {
        console.error('Error loading sleep entry', error);
      } finally {
        setLoading(false);
      }
    }
    loadTodayEntry();
  }, [today]);

  const calculateHours = () => {
    if (!bedtime || !waketime) return 0;
    const bed = new Date(`1970-01-01T${bedtime}:00`);
    const wake = new Date(`1970-01-01T${waketime}:00`);
    if (wake < bed) wake.setDate(wake.getDate() + 1); // next day
    return (wake.getTime() - bed.getTime()) / (1000 * 60 * 60);
  };

  const calculatePoints = (hours: number) => {
    // Si ambos horarios son iguales (no hay registro), 0 puntos
    if (bedtime === waketime) return 0;
    
    // Si no hay horas registradas (campos vacíos), 0 puntos
    if (hours === 0) return 0;

    const idealHours = (config.idealHours as number) || 8;
    const maxPoints = (config.maxPoints as number) || 2;
    const penaltyMode = (config.penaltyMode as string) || 'automatic';
    const penaltyPerHour = (config.penaltyPerHour as number) || 1;

    const diff = Math.abs(hours - idealHours);
    const penalty = penaltyMode === 'automatic' ? diff : penaltyPerHour * diff;

    // Permitir puntos negativos
    return maxPoints - penalty;
  };

  useEffect(() => {
    const hours = calculateHours();
    const pts = calculatePoints(hours);
    setPoints(pts);

    // Auto-save when both times are set and in editing mode
    if (bedtime && waketime && isEditing) {
      saveEntry(hours);
    }
  }, [bedtime, waketime, config, isEditing]);

  const saveEntry = async (hours: number) => {
    try {
      const res = await fetch('/api/moduleEntries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          date: today,
          data: { bedtime, waketime, hours }
        })
      });

      if (res.ok) {
        onUpdate?.({ bedtime, waketime, hours });
      }
    } catch (error) {
      console.error('Error saving sleep data', error);
    }
  };

  const hours = calculateHours();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">🌙 Sueño</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Registra tu hora de dormir y despertar para registrar tu rendimiento.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Duración</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">{hours.toFixed(1)}h</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col text-sm text-slate-700 dark:text-slate-200">
          <span className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Dormir</span>
          <input
            type="time"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            disabled={!isEditing}
            className={`rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 ${
              isEditing
                ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900'
                : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}
          />
        </label>
        <label className="flex flex-col text-sm text-slate-700 dark:text-slate-200">
          <span className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Despertar</span>
          <input
            type="time"
            value={waketime}
            onChange={(e) => setWaketime(e.target.value)}
            disabled={!isEditing}
            className={`rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition focus:ring-2 ${
              isEditing
                ? 'border-slate-300 bg-white text-slate-900 focus:border-emerald-500 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-900'
                : 'border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400'
            }`}
          />
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Puntos</p>
          <p className={`text-2xl font-semibold ${points >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {points >= 0 ? `+${points.toFixed(1)}` : points.toFixed(1)}
          </p>
        </div>
        <div className="text-right text-sm text-slate-500 dark:text-slate-400">
          Ideal: {(config.idealHours as number) || 8}h
        </div>
      </div>
    </div>
  );
};