'use client';

import React, { useState, useEffect } from 'react';
import { getLocalDateString } from '@lib/dateHelpers';
import { getColorOption } from '@lib/goalIconsColors';

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
  onUpdate?: () => void;
  isEditing?: boolean;
  date?: string;
}

type Rgb = { r: number; g: number; b: number };

function normalizeHexColor(color: string): string {
  const hex = color.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase();
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toLowerCase()}`;
  }
  return '';
}

function parseRgbString(value: string): Rgb | null {
  const match = value.match(/rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?\s*\)/i);
  if (!match) return null;
  const r = Math.min(255, Math.max(0, Number(match[1])));
  const g = Math.min(255, Math.max(0, Number(match[2])));
  const b = Math.min(255, Math.max(0, Number(match[3])));
  return { r, g, b };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function normalizeColor(color: string): string {
  if (!color) return '#3b82f6';
  const trimmed = color.trim();
  const option = getColorOption(trimmed);
  if (option && option.bgColor) {
    return option.bgColor;
  }
  const hex = normalizeHexColor(trimmed);
  if (hex) return hex;
  const rgb = parseRgbString(trimmed);
  if (rgb) return rgbToHex(rgb.r, rgb.g, rgb.b);
  return '#3b82f6';
}

function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  return {
    r: parseInt(normalized.slice(1, 3), 16),
    g: parseInt(normalized.slice(3, 5), 16),
    b: parseInt(normalized.slice(5, 7), 16),
  };
}

function getLuminance(color: string): number {
  const normalized = normalizeHexColor(color);
  if (!normalized) return 0.5;
  const rgb = hexToRgb(normalized)!;
  return (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
}

function adjustColorLuminance(hex: string, factor: number): string {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return '#3b82f6';
  const rgb = hexToRgb(normalized)!;
  return rgbToHex(
    Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
    Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
    Math.min(255, Math.max(0, Math.round(rgb.b * factor)))
  );
}

function getTextColor(color: string, isDarkMode: boolean): string {
  if (!isDarkMode) {
    return '#000000';
  }
  const resolved = normalizeColor(color);
  if (resolved === '#000000') {
    return '#9ca3af';
  }
  if (resolved === '#001f3f') {
    return '#537294';
  }

  return adjustColorLuminance(resolved, 1.5); // keep the darker theme behavior
}

function getBorderColor(color: string, isDarkMode: boolean): string {
  const resolved = normalizeColor(color);
  if (resolved === '#ffffff' && !isDarkMode) {
    return '#d1d5db'; // subtle gray border for white on light mode
  }
  if (resolved === '#000000' && isDarkMode) {
    return '#3c3c3c'; // softer gray border for black on dark mode
  }
    if (resolved === '#001f3f' && isDarkMode) {
    return '#06315e';
  }
  return resolved;
}

function getBackgroundColor(color: string): string {
  return 'transparent';
}

export const MoodDashboard: React.FC<MoodDashboardProps> = ({ config, module, onUpdate, isEditing = false, date }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

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
        onUpdate?.();
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
                backgroundColor: getBackgroundColor(normalizeColor(state.color)),
                borderColor: getBorderColor(normalizeColor(state.color), isDarkMode),
                borderWidth: '2px',
                borderStyle: 'solid',
                color: getTextColor(normalizeColor(state.color), isDarkMode),
                ['--tw-ring-color' as any]: getBorderColor(normalizeColor(state.color), isDarkMode),
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