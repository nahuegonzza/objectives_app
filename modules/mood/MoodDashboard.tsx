'use client';

import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';

interface MoodState {
  id: string;
  title: string;
  emoji: string;
  color: string;
}

interface MoodDashboardProps {
  config: Record<string, unknown>;
  module: any;
  onUpdate?: (data: any) => void;
  isEditing?: boolean;
  date?: string;
}

export const MoodDashboard: React.FC<MoodDashboardProps> = ({ config, module, onUpdate, isEditing = false, date }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);

  // Estados del config o los por defecto
  const states: MoodState[] = (config.states as MoodState[]) || [
    { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e' },
    { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6' },
    { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444' },
    { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b' },
    { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7' },
    { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4' },
  ];

  const selectedDate = date || getLocalDateString();

  useEffect(() => {
    async function loadTodayEntry() {
      try {
        const res = await fetch(`/api/moduleEntries?date=${selectedDate}&module=mood`);
        const entries = await res.json();
        if (entries && entries.length > 0) {
          const entry = entries[0];
          const data = JSON.parse(entry.data);
          setSelectedMood(data.moodId || null);
        }
      } catch (error) {
        console.error('Error loading mood entry', error);
      } finally {
        setLoading(false);
      }
    }
    loadTodayEntry();
  }, [selectedDate]);

  useEffect(() => {
    const maxPoints = (config.maxPoints as number) || 1;
    setPoints(selectedMood ? maxPoints : 0);
  }, [selectedMood, config]);

  const saveEntry = async (moodId: string) => {
    try {
      const res = await fetch('/api/moduleEntries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId: module.id,
          date: selectedDate,
          data: { moodId }
        })
      });

      if (res.ok) {
        const mood = states.find(s => s.id === moodId);
        onUpdate?.({ moodId, mood: mood?.title });
      }
    } catch (error) {
      console.error('Error saving mood data', error);
    }
  };

  const handleMoodSelect = (moodId: string) => {
    if (!isEditing) return;
    setSelectedMood(moodId);
    saveEntry(moodId);
  };

  if (loading) return <div>Loading...</div>;

  const selectedState = states.find(s => s.id === selectedMood);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">😀 Estado</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Selecciona cómo te sientes hoy.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500 dark:text-slate-400">Estado</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white">
            {selectedState ? `${selectedState.emoji} ${selectedState.title}` : '—'}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {states.map((state) => (
          <button
            key={state.id}
            type="button"
            onClick={() => handleMoodSelect(state.id)}
            disabled={!isEditing}
            className={`flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all ${
              selectedMood === state.id
                ? 'ring-2 ring-offset-2 dark:ring-offset-slate-900'
                : 'opacity-70 hover:opacity-100'
            } ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            style={{
              backgroundColor: selectedMood === state.id ? state.color + '20' : 'transparent',
              borderColor: state.color,
              borderWidth: '2px',
              borderStyle: 'solid',
              color: state.color,
              ringColor: state.color,
            }}
          >
            <span className="text-lg">{state.emoji}</span>
            <span className="hidden sm:inline">{state.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-slate-50 p-3 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Puntos</p>
          <p className={`text-2xl font-semibold ${points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {points}
          </p>
        </div>
      </div>
    </div>
  );
};