'use client';

import { useEffect, useState } from 'react';
import type { ModuleEntry } from '@types';
import type { ActiveModule } from '@lib/modules';

interface WaterDashboardProps {
  module: ActiveModule;
  date?: string;
  isEditing?: boolean;
  onUpdate?: () => void;
}

export default function WaterDashboard({ module, date, isEditing, onUpdate }: WaterDashboardProps) {
  const [entries, setEntries] = useState<ModuleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (date) {
      loadEntries();
    }
  }, [date]);

  async function loadEntries() {
    setLoading(true);
    try {
      const res = await fetch(`/api/moduleEntries?moduleId=${module.id}&date=${date}`, { credentials: 'include' });
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
    if (saving) return; // Prevent multiple clicks
    setSaving(true);

    try {
      const res = await fetch('/api/moduleEntries', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: module.id, date, data: { value: 1 } })
      });

      if (res.ok) {
        // Optimistically update local state
        const newEntry = await res.json();
        setEntries(prev => [...prev, newEntry]);
        // Notify parent component of the update
        onUpdate?.();
      }
    } catch (error) {
      // Reload on error to sync state
      loadEntries();
    } finally {
      setSaving(false);
    }
  };

  const removeGlass = async () => {
    if (saving || totalGlasses === 0) return;
    setSaving(true);

    try {
      // Find the most recent entry to remove
      const entriesWithValues = entries.filter(entry => {
        const data = JSON.parse(entry.data);
        return (data.value || 0) > 0;
      });

      if (entriesWithValues.length === 0) return;

      // For simplicity, remove the last entry. In a real app, you might want to decrement the value
      const entryToRemove = entriesWithValues[entriesWithValues.length - 1];

      const res = await fetch(`/api/moduleEntries?id=${entryToRemove.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (res.ok) {
        // Update local state
        setEntries(prev => prev.filter(e => e.id !== entryToRemove.id));
        // Notify parent component of the update
        onUpdate?.();
      } else {
        throw new Error('Failed to remove glass');
      }

    } catch (error) {
      loadEntries();
    } finally {
      setSaving(false);
    }
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
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : '+ Vaso'}
          </button>
          <button
            onClick={removeGlass}
            disabled={totalGlasses === 0 || saving}
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {saving ? 'Guardando...' : '- Vaso'}
          </button>
        </div>
      </div>
    </div>
  );
}

