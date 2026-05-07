'use client';

import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';

interface MoodState {
  id: string;
  title: string;
  emoji: string;
  color: string;
  points: number;
}

interface MoodDashboardProps {
  config: Record<string, unknown>;
  module: any;
  onUpdate?: (data: any) => void;
  isEditing?: boolean;
  date?: string;
}

// Función para calcular la luminosidad de un color hex
function getLuminance(hex: string): number {
  if (!hex || !hex.startsWith('#')) return 0.5; // Default neutral
  let color = hex;
  if (color.length === 4) {
    // Convert #RGB to #RRGGBB
    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  if (color.length !== 7) return 0.5;
  try {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  } catch {
    return 0.5;
  }
}

// Función para ajustar la luminosidad de un color hex
function adjustColorLuminance(hex: string, factor: number): string {
  if (!hex || !hex.startsWith('#')) return hex || '#6b7280'; // Return original if not hex
  let color = hex;
  if (color.length === 4) {
    // Convert #RGB to #RRGGBB
    color = '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
  }
  if (color.length !== 7) return hex || '#6b7280';
  try {
    const r = Math.min(255, Math.max(0, Math.round(parseInt(color.slice(1, 3), 16) * factor)));
    const g = Math.min(255, Math.max(0, Math.round(parseInt(color.slice(3, 5), 16) * factor)));
    const b = Math.min(255, Math.max(0, Math.round(parseInt(color.slice(5, 7), 16) * factor)));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return hex || '#6b7280';
  }
}

// Función para obtener el color del texto con buen contraste
function getTextColor(color: string): string {
  const luminance = getLuminance(color);
  if (luminance < 0.4) {
    // Color oscuro: aclarar significativamente para mejor contraste
    return adjustColorLuminance(color, 4);
  } else {
    // Color medio o claro: oscurecer para mejor contraste
    return adjustColorLuminance(color, 0.2);
  }
}

export const MoodDashboard: React.FC<MoodDashboardProps> = ({ config, module, onUpdate, isEditing = false, date }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Estados del config o los por defecto
  const states: MoodState[] = (config.states as MoodState[]) || [
    { id: 'happy', title: 'Contento', emoji: '😊', color: '#22c55e', points: 1 },
    { id: 'sad', title: 'Triste', emoji: '😢', color: '#3b82f6', points: 1 },
    { id: 'sick', title: 'Enfermo', emoji: '🤒', color: '#ef4444', points: 1 },
    { id: 'tired', title: 'Cansado', emoji: '😴', color: '#f59e0b', points: 1 },
    { id: 'energetic', title: 'Enérgico', emoji: '⚡', color: '#a855f7', points: 1 },
    { id: 'calm', title: 'Tranquilo', emoji: '😌', color: '#06b6d4', points: 1 },
  ];

  const selectedDate = date || getLocalDateString();

  useEffect(() => {
    async function loadTodayEntry() {
      try {
        const res = await fetch(`/api/moduleEntries?date=${selectedDate}&module=mood`, { credentials: 'include' });
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
    if (selectedMood) {
      const mood = states.find(s => s.id === selectedMood);
      setPoints(mood?.points || 1);
    } else {
      setPoints(0);
    }
  }, [selectedMood, states]);

  const saveEntry = async (moodId: string) => {
    try {
      const res = await fetch('/api/moduleEntries', {
        method: 'POST',
        credentials: 'include',
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
    setMessage('✓ Estado del día actualizado');
    setMessageType('success');
  };

  if (loading) return <div>Loading...</div>;

  const selectedState = states.find(s => s.id === selectedMood);

  return (
    <>
      {message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-row justify-between items-start gap-6">
          {/* Título y Descripción - Izquierda */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-400">Estado del día</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Selecciona cómo te sientes hoy.</p>
          </div>

          {/* Puntos - Derecha */}
          <div className="flex flex-col items-end">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">Puntos</p>
            <p className={`text-2xl font-semibold ${points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
              {points}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
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
                backgroundColor: selectedMood === state.id ? (state.color || '#6b7280') + '20' : 'transparent',
                borderColor: state.color || '#6b7280',
                borderWidth: '2px',
                borderStyle: 'solid',
                color: getTextColor(state.color || '#6b7280'),
                ['--tw-ring-color' as any]: state.color || '#6b7280',
              }}
            >
              <span className="text-lg">{state.emoji}</span>
              <span className="hidden sm:inline">{state.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};