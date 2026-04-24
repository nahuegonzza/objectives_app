'use client';

import { useEffect, useState } from 'react';
import type { ModuleEntry } from '@types';
import type { ActiveModule } from '@lib/modules';

interface WaterDashboardProps {
  module: ActiveModule;
  date?: string;
  isEditing?: boolean;
}

export default function WaterDashboard({ module, date, isEditing }: WaterDashboardProps) {
  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (date) {
      loadEntries();
    }
  }, [date]);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch(`/api/moduleEntries?moduleId=${module.id}&date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } finally {
      setLoading(false);
    }
  }

  const totalGlasses = entries.reduce((sum, entry) => {
    const data = JSON.parse(entry.data);
    return sum + (data.value || 0);
  }, 0);
  const goal = (module.config.dailyGoal as number) || 8;
  const progress = Math.min(totalGlasses / goal, 1);

  const addGlass = async () => {
    const res = await fetch('/api/moduleEntries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moduleId: module.id, date, data: { value: 1 } })
    });
    if (res.ok) {
      loadEntries();
    }
  };

  const removeGlass = async () => {
    // TODO: Implement remove functionality
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Agua</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Vasos hoy</span>
          <span className="text-2xl font-bold text-blue-600">{totalGlasses.toFixed(0)}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          Meta: {goal} vasos
        </div>
        <div className="flex gap-2">
          <button
            onClick={addGlass}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition"
          >
            + Vaso
          </button>
          <button
            onClick={removeGlass}
            disabled={totalGlasses === 0}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition"
          >
            - Vaso
          </button>
        </div>
      </div>
    </div>
  );
}
